import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Main Stripe Migration Class
 * Emits events: 'progress', 'error', 'log'
 */
export class StripeMigrator extends EventEmitter {
    constructor(config) {
        super();
        // Validation
        if (!config.oldApiKey) throw new Error('oldApiKey is required');
        if (!config.newApiKey) throw new Error('newApiKey is required');

        this.oldKey = config.oldApiKey;
        this.newKey = config.newApiKey;
        this.exportPath = config.exportPath || './exports';

        this.oldStripe = new Stripe(this.oldKey);
        this.newStripe = new Stripe(this.newKey);

        this.batchSize = config.batchSize || 50;

        // Ensure export directory exists
        if (!fs.existsSync(this.exportPath)) {
            fs.mkdirSync(this.exportPath, { recursive: true });
        }
    }

    log(message) {
        this.emit('log', message);
    }

    /**
     * Load or initialize the migration map
     */
    getMigrationMap() {
        const mapPath = path.join(this.exportPath, 'migration-map.json');
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        }
        return { customers: {}, products: {}, prices: {}, subscriptions: {} };
    }

    saveMigrationMap(map) {
        const mapPath = path.join(this.exportPath, 'migration-map.json');
        fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
    }

    // =========================================================================
    // EXPORT METHODS
    // =========================================================================

    async exportCustomers() {
        this.log('Starting customer export...');
        const customers = [];
        let hasMore = true;
        let startingAfter = undefined;
        let pageCount = 0;

        try {
            while (hasMore) {
                pageCount++;
                this.emit('progress', { stage: 'export_customers', message: `Fetching page ${pageCount}...`, count: customers.length });

                const response = await this.oldStripe.customers.list({
                    limit: 100,
                    starting_after: startingAfter,
                    expand: ['data.subscriptions', 'data.default_source']
                });

                customers.push(...response.data);
                hasMore = response.has_more;

                if (hasMore) {
                    startingAfter = response.data[response.data.length - 1].id;
                }
            }

            const exportFile = path.join(this.exportPath, 'customers-export.json');
            fs.writeFileSync(exportFile, JSON.stringify(customers, null, 2));

            this.log(`✅ Export complete! ${customers.length} customers exported.`);
            return customers;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async exportProducts() {
        this.log('Starting products and prices export...');
        try {
            this.emit('progress', { stage: 'export_products', message: 'Fetching products...' });
            const products = await this.oldStripe.products.list({ limit: 100, active: true });

            this.emit('progress', { stage: 'export_products', message: 'Fetching prices...' });
            const prices = await this.oldStripe.prices.list({ limit: 100, active: true });

            const exportData = {
                products: products.data,
                prices: prices.data,
                exportDate: new Date().toISOString()
            };

            const exportFile = path.join(this.exportPath, 'products-export.json');
            fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));

            this.log(`✅ Export complete! ${products.data.length} products and ${prices.data.length} prices exported.`);
            return exportData;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async exportSubscriptions() {
        this.log('Starting subscriptions export...');
        const subscriptions = [];
        let hasMore = true;
        let startingAfter = undefined;

        try {
            while (hasMore) {
                this.emit('progress', { stage: 'export_subscriptions', message: `Fetching subscriptions...`, count: subscriptions.length });

                const response = await this.oldStripe.subscriptions.list({
                    limit: 100,
                    starting_after: startingAfter,
                    status: 'all',
                    expand: ['data.items.data.price']
                });

                subscriptions.push(...response.data);
                hasMore = response.has_more;

                if (hasMore) startingAfter = response.data[response.data.length - 1].id;
            }

            const exportFile = path.join(this.exportPath, 'subscriptions-export.json');
            fs.writeFileSync(exportFile, JSON.stringify(subscriptions, null, 2));

            this.log(`✅ Export complete! ${subscriptions.length} subscriptions exported.`);
            return subscriptions;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    // =========================================================================
    // MIGRATE METHODS
    // =========================================================================

    async migrateProducts() {
        this.log('Starting product migration...');
        const exportFile = path.join(this.exportPath, 'products-export.json');
        if (!fs.existsSync(exportFile)) throw new Error('Products export not found. Run exportProducts() first.');

        const { products, prices } = JSON.parse(fs.readFileSync(exportFile));
        const migrationMap = this.getMigrationMap();

        // 1. Products
        for (const [index, product] of products.entries()) {
            if (migrationMap.products[product.id]) continue; // Skip

            try {
                this.emit('progress', { stage: 'migrate_products', message: `Migrating product ${index + 1}/${products.length}`, current: product.name });

                // Clean product payload
                const productPayload = {
                    name: product.name,
                    metadata: { ...product.metadata, old_stripe_product_id: product.id },
                    active: product.active,
                    images: product.images
                };
                if (product.description) productPayload.description = product.description;

                const newProduct = await this.newStripe.products.create(productPayload);

                migrationMap.products[product.id] = newProduct.id;
            } catch (err) {
                this.log(`❌ Failed to migrate product ${product.id}: ${err.message}`);
            }
        }
        this.saveMigrationMap(migrationMap);

        // 2. Prices
        for (const [index, price] of prices.entries()) {
            if (migrationMap.prices[price.id]) continue;

            try {
                const newProductId = migrationMap.products[price.product];
                if (!newProductId) {
                    this.log(`⚠️ Skipping price ${price.id}: Parent product not migrated.`);
                    continue;
                }

                this.emit('progress', { stage: 'migrate_prices', message: `Migrating price ${index + 1}/${prices.length}`, current: price.id });

                const priceData = {
                    product: newProductId,
                    currency: price.currency,
                    metadata: { ...price.metadata, old_stripe_price_id: price.id },
                    active: price.active,
                    nickname: price.nickname,
                };

                if (price.unit_amount !== null && price.unit_amount !== undefined) {
                    priceData.unit_amount = price.unit_amount;
                }

                // Add optional fields only if they exist
                if (price.recurring) {
                    const recurring = { ...price.recurring };
                    // Stripe API rejects null trial_period_days, must be undefined or valid integer
                    if (recurring.trial_period_days === null) delete recurring.trial_period_days;
                    // Remove other potential nulls in recurring that Stripe might complain about
                    if (recurring.aggregate_usage === null) delete recurring.aggregate_usage;
                    if (recurring.meter === null) delete recurring.meter;

                    priceData.recurring = recurring;
                }
                if (price.billing_scheme === 'tiered') {
                    priceData.billing_scheme = 'tiered';
                    if (price.tiers_mode) priceData.tiers_mode = price.tiers_mode;
                    if (price.tiers) priceData.tiers = price.tiers;
                }

                if (price.tax_behavior && price.tax_behavior !== '') {
                    priceData.tax_behavior = price.tax_behavior;
                }



                const newPrice = await this.newStripe.prices.create(priceData);
                migrationMap.prices[price.id] = newPrice.id;
            } catch (err) {
                this.log(`❌ Failed to migrate price ${price.id}: ${err.message}`);
                console.log('Failed Payload:', JSON.stringify(price, null, 2));
            }
        }
        this.saveMigrationMap(migrationMap);
        this.log('✅ Product and Price migration complete.');
    }

    async migrateCustomers() {
        this.log('Starting customer migration...');
        const exportFile = path.join(this.exportPath, 'customers-export.json');
        if (!fs.existsSync(exportFile)) throw new Error('Customers export not found. Run exportCustomers() first.');

        const customers = JSON.parse(fs.readFileSync(exportFile));
        const migrationMap = this.getMigrationMap();

        let migratedCount = 0;

        for (const [index, customer] of customers.entries()) {
            if (migrationMap.customers[customer.id]) continue;

            try {
                this.emit('progress', { stage: 'migrate_customers', message: `Migrating customer ${index + 1}/${customers.length}`, current: customer.email });

                const newCustomer = await this.newStripe.customers.create({
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                    description: customer.description,
                    address: customer.address,
                    metadata: { ...customer.metadata, old_stripe_customer_id: customer.id }
                });

                migrationMap.customers[customer.id] = newCustomer.id;
                migratedCount++;

                if (migratedCount % this.batchSize === 0) {
                    this.saveMigrationMap(migrationMap);
                }
            } catch (err) {
                this.log(`❌ Failed to migrate customer ${customer.email}: ${err.message}`);
            }
        }
        this.saveMigrationMap(migrationMap);
        this.log('✅ Customer migration complete.');
    }

    async migrateSubscriptions(options = { statusFilter: ['active', 'trialing'] }) {
        this.log('Starting subscription migration...');
        const exportFile = path.join(this.exportPath, 'subscriptions-export.json');
        if (!fs.existsSync(exportFile)) throw new Error('Subscriptions export not found.');

        const subscriptions = JSON.parse(fs.readFileSync(exportFile));
        const migrationMap = this.getMigrationMap();

        const subsToMigrate = subscriptions.filter(s => options.statusFilter.includes(s.status));
        let migratedCount = 0;

        for (const [index, sub] of subsToMigrate.entries()) {
            if (migrationMap.subscriptions[sub.id]) continue;

            try {
                const newCustomerId = migrationMap.customers[sub.customer];
                if (!newCustomerId) {
                    this.log(`Skipping sub ${sub.id}: Customer not migrated`);
                    continue;
                }

                this.emit('progress', { stage: 'migrate_subscriptions', message: `Migrating sub ${index + 1}/${subsToMigrate.length}`, current: sub.id });

                const items = sub.items.data.map(item => ({
                    price: migrationMap.prices[item.price.id],
                    quantity: item.quantity,
                    metadata: item.metadata
                })).filter(i => i.price); // Ensure we have a valid price

                if (items.length !== sub.items.data.length) {
                    this.log(`Skipping sub ${sub.id}: Some prices not migrated`);
                    continue;
                }

                const subData = {
                    customer: newCustomerId,
                    items: items,
                    metadata: { ...sub.metadata, old_stripe_subscription_id: sub.id },
                    proration_behavior: sub.proration_behavior
                };

                // Only set billing_cycle_anchor if it is in the future
                // Otherwise, it defaults to 'now' (or follows trial logic)
                const now = Math.floor(Date.now() / 1000);
                if (sub.billing_cycle_anchor > now) {
                    subData.billing_cycle_anchor = sub.billing_cycle_anchor;
                } else {
                    // If original anchor is past, we can't force it.
                    // The subscription will start "now", resetting the cycle.
                    // To strictly preserve cycle, we would need to use backdating (uncommon/complex)
                    // or set a trial_end to the next bill date.
                    if (sub.current_period_end > now) {
                        subData.trial_end = sub.current_period_end;
                    }
                }

                // Free vs Paid logic
                const isFree = sub.items.data.every(i => i.price.unit_amount === 0);
                if (isFree) {
                    subData.trial_end = 'now';
                } else {
                    subData.payment_behavior = 'default_incomplete';
                    if (sub.trial_end && sub.trial_end > Date.now() / 1000) {
                        subData.trial_end = sub.trial_end;
                    }
                }

                const newSub = await this.newStripe.subscriptions.create(subData);
                migrationMap.subscriptions[sub.id] = newSub.id;
                migratedCount++;

                if (migratedCount % 25 === 0) this.saveMigrationMap(migrationMap);

            } catch (err) {
                this.log(`❌ Failed to migrate subscription ${sub.id}: ${err.message}`);
            }
        }
        this.saveMigrationMap(migrationMap);
        this.log('✅ Subscription migration complete.');
    }
}
