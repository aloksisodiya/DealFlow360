import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.resolve(__dirname, "../dealflow360_dump.sql");

async function dumpDatabase() {
  console.log("📦 Starting Cross-Platform Database Dump...");
  
  // List of tables in correct dependency order
  const tables = [
    "admins",
    "discount_tiers",
    "warehouses",
    "products",
    "warehouse_inventory",
    "quotations",
    "quotation_fulfillment_splits",
    "invoices",
    "subscriptions",
    "approval_audit_logs",
    "portal_messages"
  ];

  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- DealFlow360 Database Dump\n`;
  sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
  sqlDump += `-- Compatible with standard Local PostgreSQL\n`;
  sqlDump += `-- ========================================================\n\n`;
  sqlDump += `BEGIN;\n\n`;

  for (const table of tables) {
    try {
      const exists = await db.schema.hasTable(table);
      if (!exists) continue;

      console.log(`  Exporting table: ${table}...`);
      const rows = await db(table).select("*");
      
      sqlDump += `-- Table: ${table} (${rows.length} rows)\n`;
      if (rows.length > 0) {
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = keys.map((key) => {
            const val = row[key];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "boolean" || typeof val === "number") return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === "object") {
              const str = JSON.stringify(val).replace(/'/g, "''");
              return `'${str}'`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          const cols = keys.map((k) => `"${k}"`).join(", ");
          const vals = values.join(", ");
          sqlDump += `INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      sqlDump += `\n`;
    } catch (err) {
      console.warn(`  Warning dumping ${table}:`, err.message);
    }
  }

  sqlDump += `COMMIT;\n`;

  fs.writeFileSync(outputFile, sqlDump, "utf8");
  console.log(`\n✅ Database dump created successfully at:\n   ${outputFile}\n`);
  console.log(`👉 Any teammate can restore this locally using: npm run db:restore\n`);
  process.exit(0);
}

dumpDatabase().catch((err) => {
  console.error("❌ Dump failed:", err);
  process.exit(1);
});
