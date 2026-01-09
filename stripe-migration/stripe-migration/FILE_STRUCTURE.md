# Stripe Migration - File Structure Overview

## 📂 Complete File Structure

```
stripe-migration/
├── scripts/                                    # All migration scripts
│   ├── 1-export-customers.js                  # Export customers from old account
│   ├── 2-export-products.js                   # Export products and prices
│   ├── 3-export-subscriptions.js              # Export subscriptions
│   ├── 4-analyze-data.js                      # Analyze exported data
│   ├── 5-migrate-products.js                  # Migrate products to new account
│   ├── 6-migrate-customers.js                 # Migrate customers
│   ├── 7-migrate-subscriptions.js             # Migrate subscriptions
│   ├── 8-generate-payment-links.js            # Generate payment update links
│   └── 9-monitor-payment-status.js            # Monitor migration progress
│
├── templates/                                  # Customer communication
│   └── email-templates.md                     # 6 email templates for all stages
│
├── config/                                     # Configuration
│   └── .env.example                           # Environment variables template
│
├── package.json                                # NPM dependencies and scripts
├── .gitignore                                  # Protect sensitive data
├── README.md                                   # Complete documentation
└── QUICK_START.md                              # Quick reference guide

# Auto-generated during migration (gitignored):
exports/                                        # All export and mapping data
├── customers-export.json
├── products-export.json
├── subscriptions-export.json
├── migration-analysis.json
├── migration-map.json
├── payment-update-links.json
├── payment-update-links.csv
└── payment-status-report.json
```

## 🎯 Script Execution Order

### Phase 1: Data Export
1. `1-export-customers.js` - Export all customers
2. `2-export-products.js` - Export products and prices
3. `3-export-subscriptions.js` - Export subscriptions
4. `4-analyze-data.js` - Generate migration analysis

### Phase 2: Migration
5. `5-migrate-products.js` - Create products in new account
6. `6-migrate-customers.js` - Migrate customers
7. `7-migrate-subscriptions.js` - Migrate subscriptions

### Phase 3: Payment Updates
8. `8-generate-payment-links.js` - Create payment update links
9. `9-monitor-payment-status.js` - Track progress (run daily)

## 📋 NPM Scripts Available

```bash
# Export phase
npm run export:customers
npm run export:products
npm run export:subscriptions
npm run export:all              # Run all exports

# Analysis
npm run analyze

# Migration phase
npm run migrate:products
npm run migrate:customers
npm run migrate:subscriptions

# Payment updates
npm run generate:payment-links
npm run monitor:status
```

## 📧 Email Templates Included

1. **Free Plan Users** - No action required notification
2. **Paid Plan Users** - Initial payment update request
3. **First Reminder** - 1 week after initial email
4. **Final Reminder** - 2 weeks after initial email
5. **Success Confirmation** - After payment method updated
6. **Migration Announcement** - 2 weeks before migration

## 🔧 Configuration Required

Edit `.env` file with:
- Old Stripe account API keys
- New Stripe account API keys
- Application URL
- Support contact information
- Migration dates

## 📊 Key Features

### Resume Capability
All scripts can be safely re-run. They skip already-migrated items.

### Batch Processing
Process large datasets in configurable batches to avoid rate limits.

### Error Handling
Comprehensive error logging with detailed error reports.

### Progress Tracking
Periodic progress saves allow resuming from interruptions.

### Data Validation
Built-in validation ensures data integrity throughout migration.

## 🎓 Documentation

- **README.md** - Complete guide with detailed explanations
- **QUICK_START.md** - Quick reference for experienced users
- **email-templates.md** - Ready-to-use customer communication
- **stripe_migration_guide.md** - Comprehensive migration strategy

## 🚀 Getting Started

```bash
# 1. Navigate to directory
cd stripe-migration

# 2. Install dependencies
npm install

# 3. Configure environment
cp config/.env.example .env
# Edit .env with your API keys

# 4. Start migration
npm run export:all
npm run analyze
```

## ⚠️ Important Notes

- **Test first** - Use Stripe test mode before production
- **Backup data** - Export and backup everything
- **Payment methods** - Cannot be transferred, customers must re-enter
- **Free vs Paid** - Free subscriptions activate immediately, paid need payment
- **Keep old account** - Don't close for 6 months after migration

## 📞 Support Resources

- Main guide: `stripe_migration_guide.md`
- Quick reference: `QUICK_START.md`
- Stripe docs: https://stripe.com/docs/api
- Stripe support: https://support.stripe.com
