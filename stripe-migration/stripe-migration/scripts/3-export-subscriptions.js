/**
 * Export Subscriptions Script
 * 
 * This script exports all subscriptions from the old Stripe account
 * with full details including items and pricing.
 * 
 * Usage: node 3-export-subscriptions.js
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

async function exportSubscriptions() {
    console.log('Starting subscriptions export...');

    const subscriptions = [];
    let hasMore = true;
    let startingAfter = undefined;
    let pageCount = 0;

    try {
        while (hasMore) {
            pageCount++;
            console.log(`Fetching page ${pageCount}...`);

            const response = await oldStripe.subscriptions.list({
                limit: 100,
                starting_after: startingAfter,
                status: 'all',
                expand: ['data.items.data.price.product']
            });

            subscriptions.push(...response.data);
            hasMore = response.has_more;

            if (hasMore) {
                startingAfter = response.data[response.data.length - 1].id;
            }

            console.log(`Fetched ${subscriptions.length} subscriptions so far...`);
        }

        // Create exports directory if it doesn't exist
        const exportsDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Save to file
        const exportPath = path.join(exportsDir, 'subscriptions-export.json');
        fs.writeFileSync(
            exportPath,
            JSON.stringify(subscriptions, null, 2)
        );

        console.log(`\n✅ Export complete!`);
        console.log(`Total subscriptions exported: ${subscriptions.length}`);
        console.log(`Export saved to: ${exportPath}`);

        // Generate summary by status
        const statusCounts = {
            active: 0,
            trialing: 0,
            past_due: 0,
            canceled: 0,
            unpaid: 0,
            incomplete: 0,
            incomplete_expired: 0
        };

        subscriptions.forEach(sub => {
            if (statusCounts.hasOwnProperty(sub.status)) {
                statusCounts[sub.status]++;
            }
        });

        console.log(`\nSubscription Status Summary:`);
        Object.entries(statusCounts).forEach(([status, count]) => {
            if (count > 0) {
                console.log(`- ${status}: ${count}`);
            }
        });

        // Count subscriptions with add-ons
        const withAddons = subscriptions.filter(s => s.items.data.length > 1).length;
        console.log(`\nSubscriptions with add-ons: ${withAddons}`);

        return subscriptions;

    } catch (error) {
        console.error('❌ Error exporting subscriptions:', error.message);
        throw error;
    }
}

// Run the export
if (import.meta.url === `file://${process.argv[1]}`) {
    exportSubscriptions()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { exportSubscriptions };
