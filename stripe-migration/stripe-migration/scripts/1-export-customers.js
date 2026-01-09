/**
 * Export Customers Script
 * 
 * This script exports all customers from the old Stripe account
 * including their subscriptions and payment methods.
 * 
 * Usage: node 1-export-customers.js
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oldStripe = new Stripe(process.env.STRIPE_SECRET_KEY_OLD);

async function exportCustomers() {
    console.log('Starting customer export...');

    const customers = [];
    let hasMore = true;
    let startingAfter = undefined;
    let pageCount = 0;

    try {
        while (hasMore) {
            pageCount++;
            console.log(`Fetching page ${pageCount}...`);

            const response = await oldStripe.customers.list({
                limit: 100,
                starting_after: startingAfter,
                expand: ['data.subscriptions', 'data.default_source']
            });

            customers.push(...response.data);
            hasMore = response.has_more;

            if (hasMore) {
                startingAfter = response.data[response.data.length - 1].id;
            }

            console.log(`Fetched ${customers.length} customers so far...`);
        }

        // Create exports directory if it doesn't exist
        const exportsDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Save to file
        const exportPath = path.join(exportsDir, 'customers-export.json');
        fs.writeFileSync(
            exportPath,
            JSON.stringify(customers, null, 2)
        );

        console.log(`\n✅ Export complete!`);
        console.log(`Total customers exported: ${customers.length}`);
        console.log(`Export saved to: ${exportPath}`);

        // Generate summary
        const withPayment = customers.filter(c =>
            c.default_source || c.invoice_settings?.default_payment_method
        ).length;

        console.log(`\nSummary:`);
        console.log(`- Customers with payment methods: ${withPayment}`);
        console.log(`- Customers without payment methods: ${customers.length - withPayment}`);

        return customers;

    } catch (error) {
        console.error('❌ Error exporting customers:', error.message);
        throw error;
    }
}

// Run the export
if (import.meta.url === `file://${process.argv[1]}`) {
    exportCustomers()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { exportCustomers };
