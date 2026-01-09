/**
 * Generate Payment Update Links Script
 * 
 * This script generates payment update links for customers with
 * paid subscriptions that need payment method re-authorization.
 * 
 * Usage: node 8-generate-payment-links.js
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

async function generatePaymentLinks(options = {}) {
    const returnUrl = options.returnUrl || process.env.APP_URL || 'https://yourapp.com/payment-updated';

    console.log('Generating payment update links...');
    console.log(`Return URL: ${returnUrl}`);

    try {
        const exportsDir = path.join(__dirname, '../exports');

        // Load data
        const subscriptions = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'subscriptions-export.json'))
        );

        const customers = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'customers-export.json'))
        );

        const migrationMap = JSON.parse(
            fs.readFileSync(path.join(exportsDir, 'migration-map.json'))
        );

        const paymentLinks = [];
        let generatedCount = 0;
        const errors = [];

        // Find paid subscriptions that need payment method
        const paidSubscriptions = subscriptions.filter(sub => {
            const isPaid = sub.items.data.some(item => item.price.unit_amount > 0);
            const isActive = sub.status === 'active' || sub.status === 'trialing';
            return isPaid && isActive;
        });

        console.log(`\n💳 Found ${paidSubscriptions.length} paid subscriptions needing payment update\n`);

        for (let i = 0; i < paidSubscriptions.length; i++) {
            const oldSub = paidSubscriptions[i];

            try {
                const newCustomerId = migrationMap.customers[oldSub.customer];
                const newSubId = migrationMap.subscriptions[oldSub.id];

                if (!newCustomerId) {
                    throw new Error(`Customer mapping not found for ${oldSub.customer}`);
                }

                // Get customer details
                const customerData = customers.find(c => c.id === oldSub.customer);

                console.log(`[${i + 1}/${paidSubscriptions.length}] Generating link for: ${customerData?.email || oldSub.customer}`);

                // Create checkout session for payment method setup
                const session = await newStripe.checkout.sessions.create({
                    customer: newCustomerId,
                    mode: 'setup',
                    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
                    cancel_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&canceled=true`,
                    payment_method_types: ['card'],
                    metadata: {
                        old_customer_id: oldSub.customer,
                        old_subscription_id: oldSub.id,
                        new_subscription_id: newSubId
                    }
                });

                // Get subscription details for email
                const planName = oldSub.items.data[0].price.product.name || 'Subscription';
                const amount = oldSub.items.data.reduce((sum, item) =>
                    sum + (item.price.unit_amount * item.quantity), 0
                );

                paymentLinks.push({
                    oldCustomerId: oldSub.customer,
                    newCustomerId: newCustomerId,
                    email: customerData?.email,
                    name: customerData?.name,
                    oldSubscriptionId: oldSub.id,
                    newSubscriptionId: newSubId,
                    planName: planName,
                    amount: `$${(amount / 100).toFixed(2)}`,
                    currency: oldSub.items.data[0].price.currency.toUpperCase(),
                    interval: oldSub.items.data[0].price.recurring?.interval || 'month',
                    paymentUpdateUrl: session.url,
                    sessionId: session.id,
                    expiresAt: new Date(session.expires_at * 1000).toISOString()
                });

                generatedCount++;
                console.log(`✅ Generated link (expires: ${new Date(session.expires_at * 1000).toLocaleString()})`);

            } catch (error) {
                console.error(`❌ Error generating link:`, error.message);
                errors.push({
                    subscriptionId: oldSub.id,
                    customerId: oldSub.customer,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Save payment links
        const linksPath = path.join(exportsDir, 'payment-update-links.json');
        fs.writeFileSync(linksPath, JSON.stringify(paymentLinks, null, 2));

        // Save CSV for easy import into email service
        const csvPath = path.join(exportsDir, 'payment-update-links.csv');
        const csvHeader = 'Email,Name,Plan,Amount,Currency,Interval,Payment Update URL,Expires At\n';
        const csvRows = paymentLinks.map(link =>
            `"${link.email}","${link.name || ''}","${link.planName}","${link.amount}","${link.currency}","${link.interval}","${link.paymentUpdateUrl}","${link.expiresAt}"`
        ).join('\n');
        fs.writeFileSync(csvPath, csvHeader + csvRows);

        // Save errors if any
        if (errors.length > 0) {
            const errorsPath = path.join(exportsDir, 'payment-link-errors.json');
            fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Payment link generation complete!');
        console.log('='.repeat(60));
        console.log(`Total paid subscriptions: ${paidSubscriptions.length}`);
        console.log(`Links generated: ${generatedCount}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`\nFiles created:`);
        console.log(`- JSON: ${linksPath}`);
        console.log(`- CSV: ${csvPath}`);

        if (errors.length > 0) {
            console.log(`\n⚠️  Errors saved to: payment-link-errors.json`);
        }

        console.log(`\n⏰ Note: Checkout sessions expire in 24 hours`);

        return {
            total: paidSubscriptions.length,
            generated: generatedCount,
            errors: errors.length,
            links: paymentLinks
        };

    } catch (error) {
        console.error('\n❌ Link generation failed:', error.message);
        throw error;
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    generatePaymentLinks()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { generatePaymentLinks };
