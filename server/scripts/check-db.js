import "dotenv/config";
import db from "../config/db.js";

try {
  await db.raw("select 1 as ok");
  console.log("PostgreSQL connection successful.");
} catch (error) {
  console.error(`PostgreSQL connection failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
