import "dotenv/config";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

const useSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DB_HOST &&
    !process.env.DB_HOST.includes("127.0.0.1") &&
    !process.env.DB_HOST.includes("localhost"));

const connection = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "dealflow360",
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };

const config = {
  development: {
    client: "pg",
    connection,
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
  production: {
    client: "pg",
    connection,
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

export default config;

