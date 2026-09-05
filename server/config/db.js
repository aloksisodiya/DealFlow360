import knex from "knex";
import config from "../knexfile.js";

const environment = process.env.NODE_ENV || "development";

if (!config[environment]) {
  throw new Error(`Unknown database environment: ${environment}`);
}

const db = knex(config[environment]);

export default db;
