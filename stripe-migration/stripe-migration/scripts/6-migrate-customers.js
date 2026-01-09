/**
 * Migrate Customers Script
 * 
 * This script migrates all customers to the new Stripe account.
 * Processes customers in batches and saves progress periodically.
 * 
 * Usage: node 6-migrate-customers.js [--batch-size=50]
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

async function migrateCustomers(options = {}) {
    const batchSize = options.batchSize || 50;

    console.log('Starting customer migration...');
    console.log(`Batch size: ${batchSize}`);

    try {
        const exportsDir = path.join(__dirname, '../exports');

        // Load data
        const customers = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'customers-export.json'))
        );

        const mapPath = path.join(exportsDir, 'migration-map.json');
        let migrationMap = JSON.parse(fs.readFileSync(mapPath));

        if (!migrationMap.customers) {
            migrationMap.customers = {};
        }

        let migratedCount = 0;
        let skippedCount = 0;
        const errors = [];

        console.log(`\n👥 Migrating ${customers.length} customers...\n`);

        for (let i = 0; i < customers.length; i++) {
            const oldCustomer = customers[i];

            // Skip if already migrated
            if (migrationMap.customers[oldCustomer.id]) {
                console.log(`⏭️  Skipping ${oldCustomer.email} (already migrated)`);
                skippedCount++;
                continue;
            }

            try {
                console.log(`[${i + 1}/${customers.length}] Migrating: ${oldCustomer.email}`);

                // Create customer in new account
                const newCustomer = await newStripe.customers.create({
                    email: oldCustomer.email,
                    name: oldCustomer.name,
                    description: oldCustomer.description,
                    phone: oldCustomer.phone,
                    metadata: {
                        ...oldCustomer.metadata,
                        old_stripe_customer_id: oldCustomer.id,
                        migration_date: new Date().toISOString()
                    },
                    address: oldCustomer.address,
                    shipping: oldCustomer.shipping,
                    tax_exempt: oldCustomer.tax_exempt,
                    preferred_locales: oldCustomer.preferred_locales,
                    invoice_settings: {
                        custom_fields: oldCustomer.invoice_settings?.custom_fields,
                        footer: oldCustomer.invoice_settings?.footer
                    }
                });

                migrationMap.customers[oldCustomer.id] = newCustomer.id;
                migratedCount++;

                console.log(`✅ Migrated: ${oldCustomer.id} → ${newCustomer.id}`);

                // Save progress periodically
                if (migratedCount % batchSize === 0) {
                    fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));
                    console.log(`\n💾 Progress saved: ${migratedCount} customers migrated\n`);
                }

            } catch (error) {
                console.error(`❌ Error migrating ${oldCustomer.email}:`, error.message);
                errors.push({
                    customerId: oldCustomer.id,
                    email: oldCustomer.email,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Final save
        fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));

        // Save errors if any
        if (errors.length > 0) {
            const errorsPath = path.join(exportsDir, 'customer-migration-errors.json');
            fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Customer migration complete!');
        console.log('='.repeat(60));
        console.log(`Total customers: ${customers.length}`);
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`Skipped (already migrated): ${skippedCount}`);
        console.log(`Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log(`\n⚠️  Errors saved to: customer-migration-errors.json`);
        }

        return {
            total: customers.length,
            migrated: migratedCount,
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
        if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
        }
    });

    return options;
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
    const options = parseArgs();

    migrateCustomers(options)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { migrateCustomers };
