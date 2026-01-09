/**
 * Monitor Payment Status Script
 * 
 * This script monitors the payment method update status for migrated customers.
 * Useful for tracking migration progress and identifying customers who haven't
 * updated their payment methods.
 * 
 * Usage: node 9-monitor-payment-status.js
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

async function monitorPaymentStatus() {
    console.log('Monitoring payment method update status...\n');

    try {
        const exportsDir = path.join(__dirname, '../exports');

        // Load migration map
        const migrationMap = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'migration-map.json'))
        );

        const stats = {
            total: 0,
            withPaymentMethod: 0,
            withoutPaymentMethod: 0,
            activeSubscriptions: 0,
            incompleteSubscriptions: 0,
            freeSubscriptions: 0,
            paidSubscriptions: 0,
            customersNeedingAction: []
        };

        const newCustomerIds = Object.values(migrationMap.customers);
        stats.total = newCustomerIds.length;

        console.log(`Checking ${stats.total} customers...\n`);

        for (let i = 0; i < newCustomerIds.length; i++) {
            const newCustomerId = newCustomerIds[i];

            if ((i + 1) % 50 === 0) {
                console.log(`Progress: ${i + 1}/${stats.total} customers checked...`);
            }

            try {
                // Get customer
                const customer = await newStripe.customers.retrieve(newCustomerId);

                // Check for payment method
                const hasPaymentMethod = !!(
                    customer.invoice_settings?.default_payment_method ||
                    customer.default_source
                );

                if (hasPaymentMethod) {
                    stats.withPaymentMethod++;
                } else {
                    stats.withoutPaymentMethod++;
                }

                // Get subscriptions
                const subscriptions = await newStripe.subscriptions.list({
                    customer: newCustomerId,
                    limit: 100
                });

                for (const sub of subscriptions.data) {
                    if (sub.status === 'active') {
                        stats.activeSubscriptions++;

                        // Check if it's a free or paid subscription
                        const isFree = sub.items.data.every(item =>
                            item.price.unit_amount === 0
                        );

                        if (isFree) {
                            stats.freeSubscriptions++;
                        } else {
                            stats.paidSubscriptions++;

                            // If paid subscription but no payment method, needs action
                            if (!hasPaymentMethod) {
                                stats.customersNeedingAction.push({
                                    customerId: newCustomerId,
                                    email: customer.email,
                                    name: customer.name,
                                    subscriptionId: sub.id,
                                    plan: sub.items.data[0].price.product,
                                    amount: sub.items.data.reduce((sum, item) =>
                                        sum + (item.price.unit_amount * item.quantity), 0
                                    ),
                                    nextBillingDate: new Date(sub.current_period_end * 1000).toISOString()
                                });
                            }
                        }
                    } else if (sub.status === 'incomplete') {
                        stats.incompleteSubscriptions++;
                    }
                }

            } catch (error) {
                console.error(`Error checking customer ${newCustomerId}:`, error.message);
            }
        }

        // Calculate percentages
        const paymentMethodRate = ((stats.withPaymentMethod / stats.total) * 100).toFixed(2);
        const activeRate = ((stats.activeSubscriptions / stats.total) * 100).toFixed(2);

        // Save detailed report
        const report = {
            generatedAt: new Date().toISOString(),
            summary: stats,
            percentages: {
                paymentMethodUpdateRate: `${paymentMethodRate}%`,
                activeSubscriptionRate: `${activeRate}%`
            }
        };

        const reportPath = path.join(exportsDir, 'payment-status-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Save customers needing action to CSV
        if (stats.customersNeedingAction.length > 0) {
            const csvPath = path.join(exportsDir, 'customers-needing-payment.csv');
            const csvHeader = 'Email,Name,Customer ID,Subscription ID,Amount,Next Billing Date\n';
            const csvRows = stats.customersNeedingAction.map(c =>
                `"${c.email}","${c.name || ''}","${c.customerId}","${c.subscriptionId}","$${(c.amount / 100).toFixed(2)}","${c.nextBillingDate}"`
            ).join('\n');
            fs.writeFileSync(csvPath, csvHeader + csvRows);
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('PAYMENT METHOD UPDATE STATUS REPORT');
        console.log('='.repeat(60));
        console.log(`\n📊 OVERALL STATISTICS:`);
        console.log(`Total Customers: ${stats.total}`);
        console.log(`With Payment Method: ${stats.withPaymentMethod} (${paymentMethodRate}%)`);
        console.log(`Without Payment Method: ${stats.withoutPaymentMethod}`);

        console.log(`\n📋 SUBSCRIPTION STATUS:`);
        console.log(`Active Subscriptions: ${stats.activeSubscriptions}`);
        console.log(`  - Free: ${stats.freeSubscriptions}`);
        console.log(`  - Paid: ${stats.paidSubscriptions}`);
        console.log(`Incomplete Subscriptions: ${stats.incompleteSubscriptions}`);

        console.log(`\n⚠️  ACTION REQUIRED:`);
        console.log(`Customers with paid subscriptions but no payment method: ${stats.customersNeedingAction.length}`);

        if (stats.customersNeedingAction.length > 0) {
            console.log(`\nTop 10 customers needing action:`);
            stats.customersNeedingAction.slice(0, 10).forEach((c, i) => {
                console.log(`${i + 1}. ${c.email} - $${(c.amount / 100).toFixed(2)} - Next billing: ${new Date(c.nextBillingDate).toLocaleDateString()}`);
            });

            if (stats.customersNeedingAction.length > 10) {
                console.log(`... and ${stats.customersNeedingAction.length - 10} more`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Report saved to: ${reportPath}`);

        if (stats.customersNeedingAction.length > 0) {
            console.log(`Customers needing payment CSV: customers-needing-payment.csv`);
        }

        return report;

    } catch (error) {
        console.error('\n❌ Monitoring failed:', error.message);
        throw error;
    }
}

// Run the monitoring
if (import.meta.url === `file://${process.argv[1]}`) {
    monitorPaymentStatus()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { monitorPaymentStatus };
