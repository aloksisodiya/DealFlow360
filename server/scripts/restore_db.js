import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dumpFile = path.resolve(__dirname, "../dealflow360_dump.sql");

async function restoreDatabase() {
  console.log("🔄 Starting Database Restore into Local PostgreSQL...");

  if (!fs.existsSync(dumpFile)) {
    console.error(`❌ Dump file not found at: ${dumpFile}`);
    console.log(`👉 Run 'npm run db:dump' or 'node scripts/seed_comprehensive_data.js' first.`);
    process.exit(1);
  }

  // Ensure migrations are run first so schema exists
  console.log("🏗️ Running schema migrations...");
  await db.migrate.latest({ directory: path.resolve(__dirname, "../migrations") });

  console.log("📥 Loading SQL dump file...");
  const sql = fs.readFileSync(dumpFile, "utf8");

  console.log("⚡ Executing dump queries...");
  await db.raw(sql);

  console.log("\n✅ Database restored successfully from dealflow360_dump.sql!");
  console.log("🎉 Local PostgreSQL is fully synchronized and ready.\n");
  process.exit(0);
}

restoreDatabase().catch((err) => {
  console.error("❌ Restore failed:", err);
  process.exit(1);
});
