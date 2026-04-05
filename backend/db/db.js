// const pgPromise = require("pg-promise");
import pgPromise from "pg-promise";
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
    this.config = {
      connectionLimit: 10,
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "webca",
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
  }

  getConfig() {
    return this.setConfig();
  }

  executeQuery(queryString, params = []) {
    return new Promise((resolve, reject) => {
      this.getConnection()
        .query(queryString, params)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          console.log("Error while connecting to database", error);
          reject(error);
        });
    });
  }
}

export default DatabaseClass;
