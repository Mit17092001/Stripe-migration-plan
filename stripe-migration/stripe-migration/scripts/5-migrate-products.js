/**
 * Migrate Products and Prices Script
 * 
 * This script creates all products and prices in the new Stripe account
 * and maintains a mapping between old and new IDs.
 * 
 * Usage: node 5-migrate-products.js
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newStripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW);

async function migrateProducts() {
    console.log('Starting product and price migration...');

    try {
        const exportsDir = path.join(__dirname, '../exports');
        const { products, prices } = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'products-export.json'))
        );

        // Load or create migration map
        const mapPath = path.join(exportsDir, 'migration-map.json');
        let migrationMap = { products: {}, prices: {} };

        if (fs.existsSync(mapPath)) {
            migrationMap = JSON.parse(fs.readFileSync(mapPath));
            console.log('Loaded existing migration map');
        }

        // Migrate products
        console.log(`\n📦 Migrating ${products.length} products...`);

        for (const oldProduct of products) {
            try {
                console.log(`\nMigrating product: ${oldProduct.name}`);

                const newProduct = await newStripe.products.create({
                    name: oldProduct.name,
                    description: oldProduct.description,
                    metadata: {
                        ...oldProduct.metadata,
                        old_stripe_product_id: oldProduct.id,
                        migrated_at: new Date().toISOString()
                    },
                    active: oldProduct.active,
                    statement_descriptor: oldProduct.statement_descriptor,
                    unit_label: oldProduct.unit_label,
                    images: oldProduct.images
                });

                migrationMap.products[oldProduct.id] = newProduct.id;
                console.log(`✅ Created: ${oldProduct.id} → ${newProduct.id}`);

            } catch (error) {
                console.error(`❌ Error migrating product ${oldProduct.id}:`, error.message);
                throw error;
            }
        }

        // Save progress
        fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));
        console.log('\n💾 Progress saved');

        // Migrate prices
        console.log(`\n💰 Migrating ${prices.length} prices...`);

        for (const oldPrice of prices) {
            try {
                console.log(`\nMigrating price: ${oldPrice.nickname || oldPrice.id}`);

                const newProductId = migrationMap.products[oldPrice.product];

                if (!newProductId) {
                    throw new Error(`Product mapping not found for ${oldPrice.product}`);
                }

                const priceData = {
                    product: newProductId,
                    currency: oldPrice.currency,
                    metadata: {
                        ...oldPrice.metadata,
                        old_stripe_price_id: oldPrice.id,
                        migrated_at: new Date().toISOString()
                    },
                    active: oldPrice.active,
                    nickname: oldPrice.nickname,
                    tax_behavior: oldPrice.tax_behavior
                };

                // Handle recurring prices
                if (oldPrice.type === 'recurring') {
                    priceData.recurring = {
                        interval: oldPrice.recurring.interval,
                        interval_count: oldPrice.recurring.interval_count,
                        usage_type: oldPrice.recurring.usage_type
                    };

                    if (oldPrice.recurring.trial_period_days) {
                        priceData.recurring.trial_period_days = oldPrice.recurring.trial_period_days;
                    }
                }

                // Handle different billing schemes
                if (oldPrice.billing_scheme === 'tiered') {
                    priceData.billing_scheme = 'tiered';
                    priceData.tiers_mode = oldPrice.tiers_mode;
                    priceData.tiers = oldPrice.tiers;
                } else {
                    priceData.unit_amount = oldPrice.unit_amount;
                }

                const newPrice = await newStripe.prices.create(priceData);
                migrationMap.prices[oldPrice.id] = newPrice.id;

                const amount = oldPrice.unit_amount
                    ? `$${(oldPrice.unit_amount / 100).toFixed(2)}`
                    : 'Tiered';
                console.log(`✅ Created: ${oldPrice.id} → ${newPrice.id} (${amount})`);

            } catch (error) {
                console.error(`❌ Error migrating price ${oldPrice.id}:`, error.message);
                throw error;
            }
        }

        // Final save
        fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('✅ Product and price migration complete!');
        console.log('='.repeat(60));
        console.log(`Products migrated: ${Object.keys(migrationMap.products).length}`);
        console.log(`Prices migrated: ${Object.keys(migrationMap.prices).length}`);
        console.log(`Mapping saved to: ${mapPath}`);

        return migrationMap;

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateProducts()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { migrateProducts };
