import "dotenv/config";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

const config = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "dealflow360",
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

export default config;
