/**
 * Export Products and Prices Script
 * 
 * This script exports all products and their associated prices
 * from the old Stripe account.
 * 
 * Usage: node 2-export-products.js
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

async function exportProducts() {
    console.log('Starting products and prices export...');

    try {
        // Export all products
        console.log('Fetching products...');
        const products = await oldStripe.products.list({
            limit: 100,
            active: true
        });

        console.log(`Found ${products.data.length} active products`);

        // Export all prices
        console.log('Fetching prices...');
        const prices = await oldStripe.prices.list({
            limit: 100,
            active: true
        });

        console.log(`Found ${prices.data.length} active prices`);

        const exportData = {
            products: products.data,
            prices: prices.data,
            exportDate: new Date().toISOString()
        };

        // Create exports directory if it doesn't exist
        const exportsDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Save to file
        const exportPath = path.join(exportsDir, 'products-export.json');
        fs.writeFileSync(
            exportPath,
            JSON.stringify(exportData, null, 2)
        );

        console.log(`\n✅ Export complete!`);
        console.log(`Export saved to: ${exportPath}`);

        // Generate summary
        console.log(`\nProduct Summary:`);
        products.data.forEach(product => {
            const productPrices = prices.data.filter(p => p.product === product.id);
            console.log(`- ${product.name}: ${productPrices.length} price(s)`);
            productPrices.forEach(price => {
                const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Tiered';
                const interval = price.recurring ? `/${price.recurring.interval}` : 'one-time';
                console.log(`  - ${price.nickname || price.id}: ${amount}${interval}`);
            });
        });

        return exportData;

    } catch (error) {
        console.error('❌ Error exporting products:', error.message);
        throw error;
    }
}

// Run the export
if (import.meta.url === `file://${process.argv[1]}`) {
    exportProducts()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { exportProducts };
