// const pgPromise = require("pg-promise");
import pgPromise from "pg-promise";

const createConfigError = (message) => {
  const error = new Error(message);
  error.code = "ENV_CONFIG";
  error.publicMessage = message;
  return error;
};

const attachPublicMessage = (error) => {
  if (error.publicMessage) {
    return error;
  }

  if (error.code === "28P01") {
    error.publicMessage =
      "Database login failed. Check DB_USER and DB_PASSWORD in backend/.env.";
    return error;
  }

  if (error.code === "3D000") {
    error.publicMessage =
      "Database not found. Check DB_NAME in backend/.env.";
    return error;
  }

  if (error.code === "ECONNREFUSED" || error.code === "57P03") {
    error.publicMessage =
      "Cannot connect to PostgreSQL. Make sure the database server is running and DB_HOST/DB_PORT are correct.";
    return error;
  }

  if (error.code === "42P01") {
    error.publicMessage =
      "Database tables are missing. Run npm run db:init inside the backend folder.";
    return error;
  }

  return error;
};

class DatabaseClass {
  constructor() {
    this.connection = undefined;
    this.pgp = pgPromise({});
    this.config = {};
  }

  createConnection() {
    this.setConfig();
    this.connection = this.pgp(this.config);
  }

  getConnection() {
    if (!this.connection) this.createConnection();
    return this.connection;
  }

  setConfig() {
    if (process.env.DATABASE_URL) {
      this.config = {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
      };
      return this.config;
    }

    const missing = ["DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
      (key) => !process.env[key],
    );

    if (missing.length > 0) {
      throw createConfigError(
        `Missing database settings: ${missing.join(", ")}. Add them to backend/.env before using signup or login.`,
      );
    }

    this.config = {
      connectionLimit: 10,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
    return this.config;
  }

  getConfig() {
    return this.setConfig();
  }

  async executeQuery(queryString, params = []) {
    try {
      const result = await this.getConnection().query(queryString, params);
      return result;
    } catch (error) {
      const normalizedError = attachPublicMessage(error);
      console.log("Error while connecting to database", normalizedError);
      throw normalizedError;
    }
  }
}

export default DatabaseClass;
