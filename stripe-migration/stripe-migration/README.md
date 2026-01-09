# Stripe Migration Scripts

This directory contains scripts for migrating Stripe subscriptions, customers, and products from one Stripe account to another.

## 📋 Prerequisites

1. **Node.js** v14 or higher
2. **Access** to both old and new Stripe accounts
3. **API Keys** for both accounts
4. **Backup** of your database

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp config/.env.example .env
```

Edit `.env` and add your Stripe API keys and application settings.

### 3. Run Migration Scripts

Follow these steps in order:

#### Phase 1: Export Data (Week 1)

```bash
# Export all data from old account
npm run export:all

# Or run individually:
npm run export:customers
npm run export:products
npm run export:subscriptions

# Analyze the exported data
npm run analyze
```

#### Phase 2: Migrate to New Account (Week 2-3)

```bash
# Step 1: Migrate products and prices
npm run migrate:products

# Step 2: Migrate customers
npm run migrate:customers

# Step 3: Migrate subscriptions
npm run migrate:subscriptions
```

#### Phase 3: Payment Method Updates (Week 4-8)

```bash
# Generate payment update links
npm run generate:payment-links

# Monitor payment method update status
npm run monitor:status
```

## 📁 Directory Structure

```
stripe-migration/
├── scripts/
│   ├── 1-export-customers.js          # Export customers from old account
│   ├── 2-export-products.js           # Export products and prices
│   ├── 3-export-subscriptions.js      # Export subscriptions
│   ├── 4-analyze-data.js              # Analyze exported data
│   ├── 5-migrate-products.js          # Create products in new account
│   ├── 6-migrate-customers.js         # Migrate customers
│   ├── 7-migrate-subscriptions.js     # Migrate subscriptions
│   ├── 8-generate-payment-links.js    # Generate payment update links
│   └── 9-monitor-payment-status.js    # Monitor migration progress
├── templates/
│   └── email-templates.md             # Email templates for customers
├── config/
│   └── .env.example                   # Environment configuration template
├── exports/                            # Generated data files (created automatically)
├── package.json
└── README.md
```

## 📝 Script Details

### 1-export-customers.js
Exports all customers from the old Stripe account including their payment methods and metadata.

**Output:** `exports/customers-export.json`

### 2-export-products.js
Exports all products and their associated prices from the old account.

**Output:** `exports/products-export.json`

### 3-export-subscriptions.js
Exports all subscriptions with full details including items and pricing.

**Output:** `exports/subscriptions-export.json`

### 4-analyze-data.js
Analyzes exported data and generates a comprehensive migration report.

**Output:** `exports/migration-analysis.json`

### 5-migrate-products.js
Creates all products and prices in the new Stripe account and maintains ID mapping.

**Output:** `exports/migration-map.json` (products and prices mapping)

### 6-migrate-customers.js
Migrates all customers to the new account.

**Options:**
- `--batch-size=50` - Set batch size for processing

**Output:** Updates `exports/migration-map.json` with customer mappings

### 7-migrate-subscriptions.js
Migrates active subscriptions. Free subscriptions are activated immediately, paid subscriptions are created in incomplete status.

**Options:**
- `--status=active,trialing` - Filter subscriptions by status

**Output:** Updates `exports/migration-map.json` with subscription mappings

### 8-generate-payment-links.js
Generates Stripe Checkout sessions for customers to update their payment methods.

**Output:** 
- `exports/payment-update-links.json` - Detailed JSON
- `exports/payment-update-links.csv` - CSV for email campaigns

### 9-monitor-payment-status.js
Monitors payment method update progress and identifies customers needing action.

**Output:**
- `exports/payment-status-report.json` - Detailed status report
- `exports/customers-needing-payment.csv` - Customers who need to update payment

## 🔄 Migration Workflow

### Recommended Phased Approach

1. **Week 1: Preparation**
   - Export all data
   - Analyze migration scope
   - Review and test scripts

2. **Week 2: Setup**
   - Migrate products and prices
   - Test in Stripe test mode first

3. **Week 3: Customer Migration**
   - Migrate customers in batches
   - Start with free plan users
   - Then migrate paid users

4. **Week 4-5: Subscription Migration**
   - Migrate free subscriptions first
   - Then migrate paid subscriptions
   - Generate payment update links

5. **Week 6-8: Payment Updates**
   - Send payment update emails
   - Monitor update progress
   - Send reminders to customers

6. **Week 9-12: Monitoring**
   - Monitor payment success rate
   - Provide customer support
   - Handle edge cases

## ⚠️ Important Notes

### Payment Methods Cannot Be Transferred
Due to PCI compliance, credit card information cannot be transferred between Stripe accounts. Customers with paid subscriptions MUST re-enter their payment information.

### Free vs Paid Subscriptions
- **Free subscriptions**: Migrated and activated immediately
- **Paid subscriptions**: Created in `incomplete` status, require payment method

### Billing Cycles
Scripts preserve billing cycle dates to ensure customers aren't charged early.

### Resume Capability
All migration scripts can be safely re-run. They skip already-migrated items based on the `migration-map.json` file.

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive API keys
2. **Use test mode first** - Test with Stripe test keys before production
3. **Backup everything** - Export and backup all data before migration
4. **Limit API key permissions** - Use restricted keys if possible
5. **Secure the exports folder** - Contains sensitive customer data

## 📊 Monitoring Progress

Use the monitoring script to track migration progress:

```bash
npm run monitor:status
```

This will show:
- Total customers migrated
- Payment method update rate
- Active vs incomplete subscriptions
- Customers needing action

## 🆘 Troubleshooting

### Script Fails Mid-Migration
All scripts save progress periodically. Simply re-run the script and it will resume from where it left off.

### Rate Limiting
If you hit Stripe rate limits, the scripts will fail. Reduce the `BATCH_SIZE` in your `.env` file and re-run.

### Missing Mappings
If you see "mapping not found" errors, ensure you've run the previous migration steps in order.

### Customer Not Found
Verify the customer exists in the old account and the export was successful.

## 📧 Customer Communication

Email templates are provided in `templates/email-templates.md`. Use these to:
- Announce the migration
- Request payment method updates
- Send reminders
- Confirm successful updates

## 🔗 Useful Commands

```bash
# Export everything and analyze
npm run export:all && npm run analyze

# Run full migration (products + customers + subscriptions)
npm run migrate:products && npm run migrate:customers && npm run migrate:subscriptions

# Check migration status
npm run monitor:status

# Generate payment links and check status
npm run generate:payment-links && npm run monitor:status
```

## 📞 Support

For issues or questions:
- Review the main migration guide
- Check Stripe API documentation
- Contact Stripe support for account-specific issues

## ⚖️ License

MIT
