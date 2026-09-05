import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: "postgres",
});

try {
  await client.connect();
  const dbName = process.env.DB_NAME || "dealflow360";
  const res = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  if (res.rows.length === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully!`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }
} catch (err) {
  console.error("Error creating database:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
