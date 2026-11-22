
import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const queueRedis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

queueRedis.on("connect", () => {
  console.log("BullMQ Redis connecting...");
});

queueRedis.on("ready", () => {
  console.log("BullMQ Redis connected successfully");
});

queueRedis.on("error", (error: Error) => {
  console.error("BullMQ Redis error:", error.message);
});

export default queueRedis;
