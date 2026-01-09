/**
 * Migrate Subscriptions Script
 * 
 * This script migrates active subscriptions to the new Stripe account.
 * Free subscriptions are activated immediately, paid subscriptions are
 * created in incomplete status pending payment method update.
 * 
 * Usage: node 7-migrate-subscriptions.js [--status=active,trialing]
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

async function migrateSubscriptions(options = {}) {
    const statusFilter = options.statusFilter || ['active', 'trialing'];

    console.log('Starting subscription migration...');
    console.log(`Migrating subscriptions with status: ${statusFilter.join(', ')}`);

    try {
        const exportsDir = path.join(__dirname, '../exports');

        // Load data
        const subscriptions = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'subscriptions-export.json'))
        );

        const mapPath = path.join(exportsDir, 'migration-map.json');
        const migrationMap = JSON.parse(fs.readFileSync(mapPath));

        if (!migrationMap.subscriptions) {
            migrationMap.subscriptions = {};
        }

        const errors = [];
        let migratedCount = 0;
        let skippedCount = 0;
        let freeCount = 0;
        let paidCount = 0;

        // Filter subscriptions by status
        const subsToMigrate = subscriptions.filter(s =>
            statusFilter.includes(s.status)
        );

        console.log(`\n📋 Found ${subsToMigrate.length} subscriptions to migrate\n`);

        for (let i = 0; i < subsToMigrate.length; i++) {
            const oldSub = subsToMigrate[i];

            // Skip if already migrated
            if (migrationMap.subscriptions[oldSub.id]) {
                console.log(`⏭️  Skipping subscription ${oldSub.id} (already migrated)`);
                skippedCount++;
                continue;
            }

            try {
                const newCustomerId = migrationMap.customers[oldSub.customer];

                if (!newCustomerId) {
                    throw new Error(`Customer mapping not found for ${oldSub.customer}`);
                }

                console.log(`\n[${i + 1}/${subsToMigrate.length}] Migrating subscription: ${oldSub.id}`);
                console.log(`Customer: ${oldSub.customer} → ${newCustomerId}`);

                // Build subscription items
                const items = oldSub.items.data.map(item => {
                    const newPriceId = migrationMap.prices[item.price.id];

                    if (!newPriceId) {
                        throw new Error(`Price mapping not found for ${item.price.id}`);
                    }

                    return {
                        price: newPriceId,
                        quantity: item.quantity,
                        metadata: item.metadata
                    };
                });

                // Check if this is a free subscription
                const isFreeSubscription = oldSub.items.data.every(item =>
                    item.price.unit_amount === 0
                );

                // Build subscription data
                const subscriptionData = {
                    customer: newCustomerId,
                    items: items,
                    metadata: {
                        ...oldSub.metadata,
                        old_stripe_subscription_id: oldSub.id,
                        migration_date: new Date().toISOString(),
                        subscription_type: isFreeSubscription ? 'free' : 'paid'
                    },

                    // Preserve billing cycle
                    billing_cycle_anchor: oldSub.billing_cycle_anchor,

                    // Copy other settings
                    collection_method: oldSub.collection_method,
                    days_until_due: oldSub.days_until_due,
                    default_tax_rates: oldSub.default_tax_rates,
                    proration_behavior: oldSub.proration_behavior,
                    description: oldSub.description
                };

                if (isFreeSubscription) {
                    // Free subscriptions can be activated immediately
                    subscriptionData.trial_end = 'now';
                    console.log('Type: FREE - Activating immediately');
                    freeCount++;
                } else {
                    // Paid subscriptions need payment method
                    subscriptionData.payment_behavior = 'default_incomplete';
                    console.log('Type: PAID - Creating as incomplete (needs payment method)');
                    paidCount++;

                    // Preserve trial if applicable
                    if (oldSub.trial_end && oldSub.trial_end > Math.floor(Date.now() / 1000)) {
                        subscriptionData.trial_end = oldSub.trial_end;
                        console.log(`Trial end preserved: ${new Date(oldSub.trial_end * 1000).toISOString()}`);
                    }
                }

                const newSub = await newStripe.subscriptions.create(subscriptionData);

                migrationMap.subscriptions[oldSub.id] = newSub.id;
                migratedCount++;

                console.log(`✅ Migrated: ${oldSub.id} → ${newSub.id}`);
                console.log(`Status: ${newSub.status}`);

                // Save progress every 25 subscriptions
                if (migratedCount % 25 === 0) {
                    fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));
                    console.log(`\n💾 Progress saved: ${migratedCount} subscriptions migrated\n`);
                }

            } catch (error) {
                console.error(`❌ Error migrating subscription ${oldSub.id}:`, error.message);
                errors.push({
                    subscriptionId: oldSub.id,
                    customerId: oldSub.customer,
                    status: oldSub.status,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Final save
        fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));

        // Save errors if any
        if (errors.length > 0) {
            const errorsPath = path.join(exportsDir, 'subscription-migration-errors.json');
            fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Subscription migration complete!');
        console.log('='.repeat(60));
        console.log(`Total subscriptions processed: ${subsToMigrate.length}`);
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`  - Free subscriptions: ${freeCount}`);
        console.log(`  - Paid subscriptions: ${paidCount}`);
        console.log(`Skipped (already migrated): ${skippedCount}`);
        console.log(`Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log(`\n⚠️  Errors saved to: subscription-migration-errors.json`);
        }

        return {
            total: subsToMigrate.length,
            migrated: migratedCount,
            free: freeCount,
            paid: paidCount,
            skipped: skippedCount,
            errors: errors.length
        };

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    args.forEach(arg => {
        if (arg.startsWith('--status=')) {
            options.statusFilter = arg.split('=')[1].split(',');
        }
    });

    return options;
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
    const options = parseArgs();

    migrateSubscriptions(options)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { migrateSubscriptions };
