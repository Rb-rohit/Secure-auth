
import { Queue } from "bullmq";
import queueRedis from "../config/queueRedis.js";

export interface OTPEmailJob {
  iv: string;
  data: string;
  tag: string;
  otpKey: string;
  otpHash: string;
}

export const EMAIL_QUEUE_NAME = "secureauth-email";

export const emailQueue = new Queue<OTPEmailJob>(
  EMAIL_QUEUE_NAME,
  {
    connection: queueRedis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: {
        age: 3600,
        count: 1000
      },
      removeOnFail: {
        age: 24 * 3600,
        count: 5000
      }
    }
  }
);
