# Stripe Migration - Quick Reference Guide

## 🎯 Migration Steps (In Order)

### 1️⃣ Setup (5 minutes)
```bash
cd stripe-migration
npm install
cp config/.env.example .env
# Edit .env with your API keys
```

### 2️⃣ Export Data from Old Account (10-15 minutes)
```bash
npm run export:all
npm run analyze
```

**Check:** Review `exports/migration-analysis.json` to understand scope

### 3️⃣ Migrate Products & Prices (5-10 minutes)
```bash
npm run migrate:products
```

**Check:** Verify products in new Stripe dashboard

### 4️⃣ Migrate Customers (30-60 minutes for 500 customers)
```bash
npm run migrate:customers
```

**Check:** Verify customer count in new Stripe dashboard

### 5️⃣ Migrate Subscriptions (30-60 minutes)
```bash
npm run migrate:subscriptions
```

**Check:** Verify subscription count in new Stripe dashboard

### 6️⃣ Generate Payment Update Links (15-20 minutes)
```bash
npm run generate:payment-links
```

**Output:** `exports/payment-update-links.csv`

### 7️⃣ Send Customer Emails
- Use templates from `templates/email-templates.md`
- Import CSV into your email service
- Send personalized payment update emails

### 8️⃣ Monitor Progress (Daily)
```bash
npm run monitor:status
```

**Check:** Payment method update rate

---

## 📊 Expected Timeline

| Phase | Duration | Scripts |
|-------|----------|---------|
| **Setup & Export** | 1 day | 1-4 |
| **Product Migration** | 1 day | 5 |
| **Customer Migration** | 2-3 days | 6 |
| **Subscription Migration** | 2-3 days | 7 |
| **Payment Updates** | 2-4 weeks | 8-9 |

**Total:** 8-12 weeks including customer payment updates

---

## 🚨 Critical Reminders

### Before You Start
- ✅ Backup your database
- ✅ Test in Stripe test mode first
- ✅ Verify new Stripe account is fully activated
- ✅ Review all scripts before running

### During Migration
- ⚠️ Run scripts in order (1 → 9)
- ⚠️ Don't skip the analysis step
- ⚠️ Monitor rate limits
- ⚠️ Save all export files

### After Migration
- 🔒 Don't delete old Stripe account for 6 months
- 📧 Send multiple reminder emails
- 📞 Provide excellent customer support
- 📊 Monitor daily with script #9

---

## 💡 Pro Tips

### Batch Processing
For large migrations, process in smaller batches:
```bash
node scripts/6-migrate-customers.js --batch-size=25
```

### Resume Failed Migrations
All scripts can be safely re-run. They skip already-migrated items.

### Test First
Use test API keys to run through entire process before production:
```bash
# In .env, use test keys
STRIPE_SECRET_KEY_OLD=sk_test_...
STRIPE_SECRET_KEY_NEW=sk_test_...
```

### Monitor Actively
Set up a daily cron job:
```bash
# Add to crontab
0 9 * * * cd /path/to/stripe-migration && npm run monitor:status >> logs/daily-status.log
```

---

## 🆘 Common Issues & Solutions

### "Customer mapping not found"
**Solution:** Run `npm run migrate:customers` first

### "Rate limit exceeded"
**Solution:** Reduce batch size, wait a few minutes, re-run

### "Invalid API key"
**Solution:** Check `.env` file has correct keys without quotes

### Script hangs
**Solution:** Check internet connection, verify API keys are active

---

## 📞 Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **Your Support Email:** (set in .env)
- **Migration Guide:** See `stripe_migration_guide.md`

---

## ✅ Pre-Flight Checklist

Before starting production migration:

- [ ] Tested all scripts in test mode
- [ ] Backed up database
- [ ] Verified new Stripe account is activated
- [ ] Prepared customer email templates
- [ ] Notified support team
- [ ] Set up monitoring
- [ ] Scheduled migration window
- [ ] Prepared rollback plan

---

## 📈 Success Metrics

Track these metrics daily:

| Metric | Target | Check With |
|--------|--------|------------|
| Customer migration rate | 100% | Script #6 output |
| Subscription migration rate | 100% | Script #7 output |
| Payment method update rate | >80% in 2 weeks | Script #9 |
| Customer support tickets | <5% of customers | Support system |
| Failed payments | <2% | Stripe dashboard |

---

## 🎓 Learning Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Billing Guide](https://stripe.com/docs/billing)
- [Migration Best Practices](https://stripe.com/docs/billing/migration)

---

**Last Updated:** January 2026  
**Version:** 1.0
