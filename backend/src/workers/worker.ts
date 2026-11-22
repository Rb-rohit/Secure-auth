
import dotenv from "dotenv";

dotenv.config();

// Importing starts the worker.
import worker from "./email.worker.js";
import queueRedis from "../config/queueRedis.js";

async function shutdown() {
  console.log("Shutting down email worker...");

  await worker.close();
  await queueRedis.quit();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
