# Migration Commands - Quick Reference

## Setup

```bash
cd stripe-migration
npm install
cp config/.env.example .env
# Edit .env with your API keys
```

**Expected Output:**
```
added 2 packages
```

---

## Step 1: Export Customers

```bash
npm run export:customers
```

**Expected Output:**
```
Starting customer export...
Fetching page 1...
Fetched 100 customers so far...
Fetching page 2...
Fetched 200 customers so far...
...

✅ Export complete!
Total customers exported: 500
Export saved to: /path/to/exports/customers-export.json

Summary:
- Customers with payment methods: 350
- Customers without payment methods: 150
```

---

## Step 2: Export Products

```bash
npm run export:products
```

**Expected Output:**
```
Starting products and prices export...
Fetching products...
Found 4 active products
Fetching prices...
Found 6 active prices

✅ Export complete!
Export saved to: /path/to/exports/products-export.json

Product Summary:
- Pro Plan: 2 price(s)
  - Monthly: $29.99/month
  - Yearly: $299.99/year
- Free Plan: 1 price(s)
  - Free: $0.00/month
- Add-on 1: 1 price(s)
  - Monthly: $9.99/month
- Add-on 2: 2 price(s)
  - Monthly: $14.99/month
  - Yearly: $149.99/year
```

---

## Step 3: Export Subscriptions

```bash
npm run export:subscriptions
```

**Expected Output:**
```
Starting subscriptions export...
Fetching page 1...
Fetched 100 subscriptions so far...
Fetching page 2...
Fetched 200 subscriptions so far...
...

✅ Export complete!
Total subscriptions exported: 500
Export saved to: /path/to/exports/subscriptions-export.json

Subscription Status Summary:
- active: 450
- trialing: 20
- past_due: 10
- canceled: 20

Subscriptions with add-ons: 75
```

---

## Step 4: Analyze Data

```bash
npm run analyze
```

**Expected Output:**
```
Starting data analysis...

============================================================
MIGRATION ANALYSIS REPORT
============================================================

📊 CUSTOMER SUMMARY:
Total Customers: 500
With Payment Methods: 350
Without Payment Methods: 150

📋 SUBSCRIPTION SUMMARY:
Total Subscriptions: 500
Active: 450
Trialing: 20
Free Subscriptions: 100
Paid Subscriptions: 400
With Add-ons: 75

📦 PRODUCT SUMMARY:
Total Products: 4
Total Prices: 6

- Pro Plan:
  Total Prices: 2
  Free Prices: 0
  Paid Prices: 2

- Free Plan:
  Total Prices: 1
  Free Prices: 1
  Paid Prices: 0

⚠️  MIGRATION ESTIMATE:
Customers to Migrate: 500
Active Subscriptions: 470
Customers Needing Payment Update: 400
Estimated Timeline: 12 weeks
Estimated Hours: 130-185 hours

============================================================

✅ Analysis complete! Report saved to: /path/to/exports/migration-analysis.json
```

---

## Step 5: Migrate Products

```bash
npm run migrate:products
```

**Expected Output:**
```
Starting product and price migration...

📦 Migrating 4 products...

Migrating product: Pro Plan
✅ Created: prod_old123 → prod_new456

Migrating product: Free Plan
✅ Created: prod_old124 → prod_new457

Migrating product: Add-on 1
✅ Created: prod_old125 → prod_new458

Migrating product: Add-on 2
✅ Created: prod_old126 → prod_new459

💾 Progress saved

💰 Migrating 6 prices...

Migrating price: Pro Monthly
✅ Created: price_old789 → price_new012 ($29.99)

Migrating price: Pro Yearly
✅ Created: price_old790 → price_new013 ($299.99)

Migrating price: Free Monthly
✅ Created: price_old791 → price_new014 ($0.00)

Migrating price: Add-on 1 Monthly
✅ Created: price_old792 → price_new015 ($9.99)

Migrating price: Add-on 2 Monthly
✅ Created: price_old793 → price_new016 ($14.99)

Migrating price: Add-on 2 Yearly
✅ Created: price_old794 → price_new017 ($149.99)

============================================================
✅ Product and price migration complete!
============================================================
Products migrated: 4
Prices migrated: 6
Mapping saved to: /path/to/exports/migration-map.json
```

---

## Step 6: Migrate Customers

```bash
npm run migrate:customers
```

**Expected Output:**
```
Starting customer migration...
Batch size: 50

👥 Migrating 500 customers...

[1/500] Migrating: john@example.com
✅ Migrated: cus_old123 → cus_new456

[2/500] Migrating: jane@example.com
✅ Migrated: cus_old124 → cus_new457

...

[50/500] Migrating: user50@example.com
✅ Migrated: cus_old172 → cus_new504

💾 Progress saved: 50 customers migrated

...

============================================================
✅ Customer migration complete!
============================================================
Total customers: 500
Successfully migrated: 500
Skipped (already migrated): 0
Errors: 0
```

---

## Step 7: Migrate Subscriptions

```bash
npm run migrate:subscriptions
```

**Expected Output:**
```
Starting subscription migration...
Migrating subscriptions with status: active, trialing

📋 Found 470 subscriptions to migrate

[1/470] Migrating subscription: sub_old123
Customer: cus_old123 → cus_new456
Type: PAID - Creating as incomplete (needs payment method)
✅ Migrated: sub_old123 → sub_new789
Status: incomplete

[2/470] Migrating subscription: sub_old124
Customer: cus_old124 → cus_new457
Type: FREE - Activating immediately
✅ Migrated: sub_old124 → sub_new790
Status: active

...

[25/470] Migrating subscription: sub_old147
Customer: cus_old147 → cus_new480
Type: PAID - Creating as incomplete (needs payment method)
✅ Migrated: sub_old147 → sub_new813
Status: incomplete

💾 Progress saved: 25 subscriptions migrated

...

============================================================
✅ Subscription migration complete!
============================================================
Total subscriptions processed: 470
Successfully migrated: 470
  - Free subscriptions: 100
  - Paid subscriptions: 370
Skipped (already migrated): 0
Errors: 0
```

---

## Step 8: Generate Payment Links

```bash
npm run generate:payment-links
```

**Expected Output:**
```
Generating payment update links...
Return URL: https://yourapp.com/payment-updated

💳 Found 370 paid subscriptions needing payment update

[1/370] Generating link for: john@example.com
✅ Generated link (expires: 1/10/2026, 6:41:53 PM)

[2/370] Generating link for: jane@example.com
✅ Generated link (expires: 1/10/2026, 6:41:54 PM)

...

============================================================
✅ Payment link generation complete!
============================================================
Total paid subscriptions: 370
Links generated: 370
Errors: 0

Files created:
- JSON: /path/to/exports/payment-update-links.json
- CSV: /path/to/exports/payment-update-links.csv

⏰ Note: Checkout sessions expire in 24 hours
```

---

## Step 9: Monitor Payment Status

```bash
npm run monitor:status
```

**Expected Output:**
```
Monitoring payment method update status...

Checking 500 customers...

Progress: 50/500 customers checked...
Progress: 100/500 customers checked...
...
Progress: 500/500 customers checked...

============================================================
PAYMENT METHOD UPDATE STATUS REPORT
============================================================

📊 OVERALL STATISTICS:
Total Customers: 500
With Payment Method: 125 (25.00%)
Without Payment Method: 375

📋 SUBSCRIPTION STATUS:
Active Subscriptions: 225
  - Free: 100
  - Paid: 125
Incomplete Subscriptions: 245

⚠️  ACTION REQUIRED:
Customers with paid subscriptions but no payment method: 245

Top 10 customers needing action:
1. john@example.com - $29.99 - Next billing: 2/1/2026
2. jane@example.com - $299.99 - Next billing: 2/5/2026
3. bob@example.com - $29.99 - Next billing: 2/7/2026
4. alice@example.com - $39.98 - Next billing: 2/10/2026
5. charlie@example.com - $29.99 - Next billing: 2/12/2026
6. david@example.com - $44.98 - Next billing: 2/15/2026
7. emma@example.com - $299.99 - Next billing: 2/18/2026
8. frank@example.com - $29.99 - Next billing: 2/20/2026
9. grace@example.com - $29.99 - Next billing: 2/22/2026
10. henry@example.com - $39.98 - Next billing: 2/25/2026
... and 235 more

============================================================
Report saved to: /path/to/exports/payment-status-report.json
Customers needing payment CSV: customers-needing-payment.csv
```

---

## Run All Export Steps

```bash
npm run export:all
```

This runs steps 1-3 sequentially.

---

## Troubleshooting

### If a script fails mid-way:
Simply re-run the same command. All scripts have resume capability and will skip already-migrated items.

### Check for errors:
Look for these files in the `exports/` directory:
- `customer-migration-errors.json`
- `subscription-migration-errors.json`
- `payment-link-errors.json`

### Rate limiting:
If you hit rate limits, reduce batch size:
```bash
node scripts/6-migrate-customers.js --batch-size=25
```
