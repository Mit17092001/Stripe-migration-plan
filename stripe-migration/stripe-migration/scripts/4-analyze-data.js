/**
 * Analyze Exported Data Script
 * 
 * This script analyzes the exported data and generates a comprehensive
 * migration analysis report.
 * 
 * Usage: node 4-analyze-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeData() {
    console.log('Starting data analysis...');

    try {
        const exportsDir = path.join(__dirname, '../exports');

        // Load exported data
        const customers = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'customers-export.json'))
        );
        const subscriptions = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'subscriptions-export.json'))
        );
        const { products, prices } = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'products-export.json'))
        );

        // Analyze customers
        const customersWithPaymentMethods = customers.filter(c =>
            c.default_source || c.invoice_settings?.default_payment_method
        ).length;

        const customersWithoutPaymentMethods = customers.length - customersWithPaymentMethods;

        // Analyze subscriptions by status
        const subscriptionsByStatus = {
            active: subscriptions.filter(s => s.status === 'active').length,
            trialing: subscriptions.filter(s => s.status === 'trialing').length,
            past_due: subscriptions.filter(s => s.status === 'past_due').length,
            canceled: subscriptions.filter(s => s.status === 'canceled').length,
            unpaid: subscriptions.filter(s => s.status === 'unpaid').length,
            incomplete: subscriptions.filter(s => s.status === 'incomplete').length,
            incomplete_expired: subscriptions.filter(s => s.status === 'incomplete_expired').length
        };

        // Analyze products and prices
        const productAnalysis = products.map(p => {
            const productPrices = prices.filter(pr => pr.product === p.id);
            const freePrices = productPrices.filter(pr => pr.unit_amount === 0);

            return {
                id: p.id,
                name: p.name,
                active: p.active,
                totalPrices: productPrices.length,
                freePrices: freePrices.length,
                paidPrices: productPrices.length - freePrices.length,
                prices: productPrices.map(pr => ({
                    id: pr.id,
                    nickname: pr.nickname,
                    amount: pr.unit_amount,
                    currency: pr.currency,
                    recurring: pr.recurring ? `${pr.recurring.interval}` : 'one-time',
                    isFree: pr.unit_amount === 0
                }))
            };
        });

        // Identify free vs paid subscriptions
        const freeSubscriptions = subscriptions.filter(s =>
            s.items.data.every(item => item.price.unit_amount === 0)
        );

        const paidSubscriptions = subscriptions.filter(s =>
            s.items.data.some(item => item.price.unit_amount > 0)
        );

        // Count subscriptions with add-ons
        const subscriptionsWithAddons = subscriptions.filter(s =>
            s.items.data.length > 1
        ).length;

        // Build comprehensive analysis
        const analysis = {
            generatedAt: new Date().toISOString(),

            customerSummary: {
                totalCustomers: customers.length,
                customersWithPaymentMethods,
                customersWithoutPaymentMethods,
                percentageWithPayment: ((customersWithPaymentMethods / customers.length) * 100).toFixed(2) + '%'
            },

            subscriptionSummary: {
                totalSubscriptions: subscriptions.length,
                byStatus: subscriptionsByStatus,
                freeSubscriptions: freeSubscriptions.length,
                paidSubscriptions: paidSubscriptions.length,
                subscriptionsWithAddons,
                activeSubscriptionsToMigrate: subscriptionsByStatus.active + subscriptionsByStatus.trialing
            },

            productSummary: {
                totalProducts: products.length,
                totalPrices: prices.length,
                products: productAnalysis
            },

            migrationEstimate: {
                customersToMigrate: customers.length,
                activeSubscriptionsToMigrate: subscriptionsByStatus.active + subscriptionsByStatus.trialing,
                customersNeedingPaymentUpdate: paidSubscriptions.filter(s =>
                    s.status === 'active' || s.status === 'trialing'
                ).length,
                estimatedTimeWeeks: 12,
                estimatedHours: '130-185'
            },

            riskAssessment: {
                highRiskCustomers: paidSubscriptions.filter(s =>
                    s.status === 'active' || s.status === 'trialing'
                ).length,
                lowRiskCustomers: freeSubscriptions.length,
                complexSubscriptions: subscriptionsWithAddons
            }
        };

        // Save analysis
        const analysisPath = path.join(exportsDir, 'migration-analysis.json');
        fs.writeFileSync(
            analysisPath,
            JSON.stringify(analysis, null, 2)
        );

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION ANALYSIS REPORT');
        console.log('='.repeat(60));

        console.log('\n📊 CUSTOMER SUMMARY:');
        console.log(`Total Customers: ${analysis.customerSummary.totalCustomers}`);
        console.log(`With Payment Methods: ${customersWithPaymentMethods}`);
        console.log(`Without Payment Methods: ${customersWithoutPaymentMethods}`);

        console.log('\n📋 SUBSCRIPTION SUMMARY:');
        console.log(`Total Subscriptions: ${analysis.subscriptionSummary.totalSubscriptions}`);
        console.log(`Active: ${subscriptionsByStatus.active}`);
        console.log(`Trialing: ${subscriptionsByStatus.trialing}`);
        console.log(`Free Subscriptions: ${freeSubscriptions.length}`);
        console.log(`Paid Subscriptions: ${paidSubscriptions.length}`);
        console.log(`With Add-ons: ${subscriptionsWithAddons}`);

        console.log('\n📦 PRODUCT SUMMARY:');
        console.log(`Total Products: ${products.length}`);
        console.log(`Total Prices: ${prices.length}`);
        productAnalysis.forEach(p => {
            console.log(`\n- ${p.name}:`);
            console.log(`  Total Prices: ${p.totalPrices}`);
            console.log(`  Free Prices: ${p.freePrices}`);
            console.log(`  Paid Prices: ${p.paidPrices}`);
        });

        console.log('\n⚠️  MIGRATION ESTIMATE:');
        console.log(`Customers to Migrate: ${analysis.migrationEstimate.customersToMigrate}`);
        console.log(`Active Subscriptions: ${analysis.migrationEstimate.activeSubscriptionsToMigrate}`);
        console.log(`Customers Needing Payment Update: ${analysis.migrationEstimate.customersNeedingPaymentUpdate}`);
        console.log(`Estimated Timeline: ${analysis.migrationEstimate.estimatedTimeWeeks} weeks`);
        console.log(`Estimated Hours: ${analysis.migrationEstimate.estimatedHours} hours`);

        console.log('\n' + '='.repeat(60));
        console.log(`\n✅ Analysis complete! Report saved to: ${analysisPath}`);

        return analysis;

    } catch (error) {
        console.error('❌ Error analyzing data:', error.message);
        throw error;
    }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
    analyzeData();
}

export { analyzeData };
