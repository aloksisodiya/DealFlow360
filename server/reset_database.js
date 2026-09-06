import "dotenv/config";
import db from "./config/db.js";
import knex from "knex";
import config from "./knexfile.js";

const env = process.env.NODE_ENV || "development";
const k = knex(config[env]);

async function resetAndSequenceDatabase() {
  console.log("🔄 Starting DealFlow360 Clean Database Sequencing & Migration...\n");

  try {
    console.log("1. Dropping existing tables cleanly in foreign-key dependency order...");
    await k.raw(`
      DROP TABLE IF EXISTS "portal_line_comments" CASCADE;
      DROP TABLE IF EXISTS "portal_messages" CASCADE;
      DROP TABLE IF EXISTS "deal_health_rules" CASCADE;
      DROP TABLE IF EXISTS "recent_activities" CASCADE;
      DROP TABLE IF EXISTS "deal_health_alerts" CASCADE;
      DROP TABLE IF EXISTS "credit_notes" CASCADE;
      DROP TABLE IF EXISTS "subscriptions" CASCADE;
      DROP TABLE IF EXISTS "invoices" CASCADE;
      DROP TABLE IF EXISTS "quotation_fulfillment_splits" CASCADE;
      DROP TABLE IF EXISTS "warehouse_inventory" CASCADE;
      DROP TABLE IF EXISTS "warehouses" CASCADE;
      DROP TABLE IF EXISTS "approval_audit_logs" CASCADE;
      DROP TABLE IF EXISTS "quotations" CASCADE;
      DROP TABLE IF EXISTS "discount_tiers" CASCADE;
      DROP TABLE IF EXISTS "products" CASCADE;
      DROP TABLE IF EXISTS "admins" CASCADE;
      DROP TABLE IF EXISTS "customers" CASCADE;
      DROP TABLE IF EXISTS "finance_users" CASCADE;
      DROP TABLE IF EXISTS "sales_managers" CASCADE;
      DROP TABLE IF EXISTS "sales_reps" CASCADE;
      DROP TABLE IF EXISTS "knex_migrations_lock" CASCADE;
      DROP TABLE IF EXISTS "knex_migrations" CASCADE;
    `);
    console.log("✅ All old tables and migration locks dropped successfully.\n");

    console.log("2. Running 6 Sequenced Database Migrations...");
    const [batchNo, log] = await k.migrate.latest();
    console.log(`✅ Batch ${batchNo} executed ${log.length} sequenced migrations:`);
    log.forEach((m) => console.log(`   - ${m}`));
    console.log("");

    console.log("3. Running 6 Sequenced Database Seeds...");
    const [seedFiles] = await k.seed.run();
    console.log(`✅ Seeded ${seedFiles.length} files in dependency order:`);
    seedFiles.forEach((s) => console.log(`   - ${s}`));
    console.log("");

    console.log("=================================================");
    console.log("🎉 DATABASE IS PROPERLY ARRANGED & 100% SEQUENCED");
    console.log("=================================================\n");
  } catch (error) {
    console.error("❌ Database reset error:", error);
    process.exit(1);
  } finally {
    await k.destroy();
  }
}

resetAndSequenceDatabase();
