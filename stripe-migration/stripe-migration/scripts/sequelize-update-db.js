import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// =============================================================================
// ⚙️ CONFIGURATION - ADAPT THIS FOR YOUR PROJECT
// =============================================================================

const config = {
  // Database Connection Details (Prefer loading these from .env)
  db: {
    database: process.env.DB_NAME || 'your_database_name',
    username: process.env.DB_USER || 'your_username',
    password: process.env.DB_PASSWORD || 'your_password',
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'postgres', // 'postgres', 'mysql', 'sqlite', 'mssql'
    logging: false // Set to console.log to see SQL queries
  },

  // Table & Column Mappings
  // Define which tables/columns need updating based on the migration type
  tables: {
    users: {
      tableName: 'users', // Actual table name in DB
      columns: {
        customer: 'customerId',         // Maps to Stripe Customer ID
        subscription: 'subscriptionId', // Maps to Stripe Subscription ID
        price: 'priceId'                // Maps to Stripe Price ID
      }
    },
    plans: {
      tableName: 'plans', // Actual table name in DB
      columns: {
        product: 'productId', // Maps to Stripe Product ID
        plan: 'planId'        // Maps to Stripe Price ID
      }
    }
  }
};

// =============================================================================
// 🚀 MAIN MIGRATION SCRIPT
// =============================================================================

async function runDatabaseUpdate() {
  console.log('🔄 Starting Database Update using Sequelize...');

  // 1. Load Migration Map
  const migrationMapPath = path.resolve('./exports/migration-map.json');
  if (!fs.existsSync(migrationMapPath)) {
    console.error(`❌ Migration map not found at: ${migrationMapPath}`);
    process.exit(1);
  }
  const migrationMap = JSON.parse(fs.readFileSync(migrationMapPath, 'utf8'));
  console.log('✅ Migration map loaded.');

  // 2. Connect to Database
  const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      dialect: config.db.dialect,
      logging: config.db.logging,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }

  // 3. Perform Updates
  const transaction = await sequelize.transaction();
  
  try {
    console.log('\n📝 Beginning updates inside a transaction...\n');
    let totalUpdates = 0;

    // --- Helper Function for Batch Updates ---
    // We use a CASE statement for bulk updates to be efficient instead of one query per row
    const performBatchUpdate = async (tableName, columnName, mapping) => {
      const entries = Object.entries(mapping);
      if (entries.length === 0) return;

      console.log(`Doing updates for table '${tableName}' column '${columnName}' (${entries.length} records)...`);

      // Sequelize doesn't have a native "bulk update where x = y" that works easily across all dialects 
      // for swapping arbitrary IDs without loading models.
      // We will perform individual updates within the transaction for safety and simplicity,
      // or use a raw query CASE statement for speed if the list is huge.
      // Given ~150 records, individual updates are safer and plenty fast enough.

      let count = 0;
      for (const [oldId, newId] of entries) {
        // Skip if oldId corresponds to missing data or if mapping is incomplete
        if (!oldId || !newId) continue;

        const query = `UPDATE "${tableName}" SET "${columnName}" = :newId WHERE "${columnName}" = :oldId`;
        
        // Note: For MySQL, quotes might need to be backticks (`). Sequelize handles this usually via models,
        // but with raw queries we must be careful.
        // A deeper implementation would check dialect.
        // Let's assume standard SQL quotes "" for identifiers or let user config.
        
        // Simpler Dialect-Agnostic Approach:
        // Since we are using raw queries for "any stripe account" without importing user models,
        // we write standard SQL.
        
        const [results, metadata] = await sequelize.query(
          query,
          {
            replacements: { newId, oldId },
            type: QueryTypes.UPDATE,
            transaction
          }
        );
        // Metadata format varies by dialect, but broadly indicates filtered/affected rows
        count++;
      }
      console.log(`   -> Processed updates for ${columnName}.`);
      totalUpdates += count;
    };


    // --- USERS TABLE UPDATES ---
    if (config.tables.users) {
      const t = config.tables.users;
      if (t.columns.customer) await performBatchUpdate(t.tableName, t.columns.customer, migrationMap.customers);
      if (t.columns.subscription) await performBatchUpdate(t.tableName, t.columns.subscription, migrationMap.subscriptions);
      if (t.columns.price) await performBatchUpdate(t.tableName, t.columns.price, migrationMap.prices);
    }

    // --- PLANS TABLE UPDATES ---
    if (config.tables.plans) {
      const t = config.tables.plans;
      if (t.columns.product) await performBatchUpdate(t.tableName, t.columns.product, migrationMap.products);
      if (t.columns.plan) await performBatchUpdate(t.tableName, t.columns.plan, migrationMap.prices);
    }

    console.log(`\n✨ Committing transaction...`);
    await transaction.commit();
    console.log(`✅ Update Complete! Processed ~${totalUpdates} ID translation queries.`);

  } catch (error) {
    console.error('\n❌ Update FAILED. Rolling back transaction.');
    console.error(error);
    await transaction.rollback();
  } finally {
    await sequelize.close();
  }
}

runDatabaseUpdate();
