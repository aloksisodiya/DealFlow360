import db from "../config/db.js";
import { seed } from "../seeds/05_invoices_and_subscriptions.js";

async function run() {
  try {
    console.log("Seeding warranty subscriptions...");
    await seed(db);
    console.log("Done seeding warranty subscriptions!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

run();
