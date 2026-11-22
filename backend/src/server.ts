import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import redis from "./config/redis.js";
import { connectDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase();
    await redis.ping();

    const server = app.listen(PORT, () => {
      console.log(`SecureAuth API running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log("Shutting down SecureAuth...");

      server.close(async () => {
        await redis.quit();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();