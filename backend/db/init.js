import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import DatabaseClass from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "schema.sql");

const run = async () => {
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const database = new DatabaseClass();

  try {
    await database.getConnection().multi(schemaSql);
    console.log("Database schema created successfully.");
  } catch (error) {
    console.error(error.publicMessage || error.message);
    process.exitCode = 1;
  } finally {
    if (database.connection) {
      await database.connection.$pool.end();
    }
  }
};

run();
