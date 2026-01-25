# Stripe Account Migrator

A comprehensive Node.js library to assist in migrating data between Stripe accounts. It handles customers, products, prices, and subscriptions, preserving mappings to ensure data integrity.

## Features

- **Resume Capability:** Saves state to a local JSON map; can be stopped and resumed.
- **Event Driven:** Emit events for progress tracking (perfect for building UIs).
- **Safe:** Recommends "dry runs" and handles rate limiting basics by using the official Stripe SDK.
- **Flexible:** Use it programmatically in your own scripts.

## Installation

```bash
npm install stripe-account-migrator
```

## Usage

```javascript
import { StripeMigrator } from 'stripe-account-migrator';

const migrator = new StripeMigrator({
  oldApiKey: 'sk_live_old...',
  newApiKey: 'sk_live_new...',
  exportPath: './migration-data'
});

migrator.on('progress', console.log);

// Step 1: Export
await migrator.exportCustomers();
await migrator.exportProducts();
await migrator.exportSubscriptions();

// Step 2: Migrate
await migrator.migrateProducts();
await migrator.migrateCustomers();
await migrator.migrateSubscriptions();
```

## Migration Order

It is **critical** to run migrations in this order:
1. **Products & Prices**: Subscriptions depend on Prices.
2. **Customers**: Subscriptions belong to Customers.
3. **Subscriptions**: Depend on both Customers and Prices.

## License

MIT
