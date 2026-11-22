
import { Worker, UnrecoverableError } from "bullmq";
import queueRedis from "../config/queueRedis.js";
import redis from "../config/redis.js";

import { EMAIL_QUEUE_NAME, OTPEmailJob } from "../queues/email.queue.js";
import { decryptEmailPayload } from "../utils/emailJobCrypto.js";
import { sendOTPEmail } from "../services/email.service.js";

const worker = new Worker<OTPEmailJob>(
  EMAIL_QUEUE_NAME,

  async (job) => {
    const { otpKey, otpHash } = job.data;

    // Do not send an OTP that has expired or been replaced.
    const [storedHash, ttl] = await Promise.all([
      redis.get(otpKey),
      redis.ttl(otpKey)
    ]);

    if (!storedHash || storedHash !== otpHash || ttl <= 0) {
      throw new UnrecoverableError(
        "OTP expired or replaced. Email will not be sent."
      );
    }

    const { email, otp } = decryptEmailPayload(job.data);

    await sendOTPEmail(email, otp);

    console.log(`OTP email delivered for job ${job.id}`);

    return {
      sent: true
    };
  },

  {
    connection: queueRedis,
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(
    `Email job failed: ${job?.id}`,
    error.message
  );
});

worker.on("error", (error) => {
  console.error("Email worker error:", error.message);
});

console.log("SecureAuth email worker started");

export default worker;
