
import redis from "../config/redis.js";

import {
  generateOTP,
  hashOTP,
  hashEmail
} from "../utils/crypto.js";

import { emailQueue } from "../queues/email.queue.js";
import { encryptEmailPayload } from "../utils/emailJobCrypto.js";

import { randomUUID } from "node:crypto";

const OTP_EXPIRY = 300;
const RESEND_COOLDOWN = 60;


const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 900;

const VERIFY_OTP_SCRIPT = `
local lockKey = KEYS[1]
local otpKey = KEYS[2]
local attemptsKey = KEYS[3]

local submittedHash = ARGV[1]
local maxAttempts = tonumber(ARGV[2])
local lockDuration = tonumber(ARGV[3])

if redis.call("EXISTS", lockKey) == 1 then
  return -2
end

local storedHash = redis.call("GET", otpKey)

if not storedHash then
  return 0
end

if storedHash == submittedHash then
  redis.call("DEL", otpKey)
  redis.call("DEL", attemptsKey)
  return 1
end

local attempts = redis.call("INCR", attemptsKey)

if attempts == 1 then
  redis.call("EXPIRE", attemptsKey, 600)
end

if attempts >= maxAttempts then
  redis.call("SET", lockKey, "1", "EX", lockDuration)
  redis.call("DEL", otpKey)
  return -1
end

return 0
`;


export async function requestOTP(
  email: string,
  ip: string
) {
  const emailHash = hashEmail(email);

  const otpKey = `auth:otp:${emailHash}`;
  const cooldownKey = `auth:cooldown:${emailHash}`;
  const lockKey = `auth:lock:${emailHash}`;

  const requestLimitKey = `auth:request-limit:${emailHash}`;
  const ipLimitKey = `auth:ip-limit:${hashEmail(ip)}`;

  if (await redis.exists(lockKey)) {
    return { success: true };
  }

  // Reserve hourly request counters.
  const requestCount = await redis.incr(requestLimitKey);

  if (requestCount === 1) {
    await redis.expire(requestLimitKey, 3600);
  }

  const ipCount = await redis.incr(ipLimitKey);

  if (ipCount === 1) {
    await redis.expire(ipLimitKey, 3600);
  }

  if (requestCount > 5 || ipCount > 20) {
    throw new Error("OTP request limit exceeded");
  }

  // Acquire resend cooldown.
  const cooldown = await redis.set(
    cooldownKey,
    "1",
    "EX",
    RESEND_COOLDOWN,
    "NX"
  );

  if (cooldown !== "OK") {
    throw new Error(
      "Please wait before requesting another OTP"
    );
  }

  const otp = generateOTP();
  const otpHash = hashOTP(email, otp);

  try {
    // Store only the OTP hash in the authentication key.
    await redis.set(
      otpKey,
      otpHash,
      "EX",
      OTP_EXPIRY
    );

    // Encrypt sensitive data before adding it to BullMQ.
    const encryptedPayload = encryptEmailPayload({
      email,
      otp
    });

    await emailQueue.add(
      "send-otp",
      {
        ...encryptedPayload,
        otpKey,
        otpHash
      },
      {
        jobId: `otp-${randomUUID()}`,
        removeOnComplete: {
          age: 3600,
          count: 1000
        }
      }
    );

    return {
      success: true,
      queued: true
    };
  } catch (error) {
    // Remove temporary authentication state if enqueueing fails.
    await redis.del(otpKey, cooldownKey);

    throw error;
  }
}



export async function verifyOTP(email: string, otp: string) {
  const emailHash = hashEmail(email);

  const otpKey = `auth:otp:${emailHash}`;
  const lockKey = `auth:lock:${emailHash}`;
  const attemptsKey = `auth:attempts:${emailHash}`;

  const submittedHash = hashOTP(email, otp);

  const result = await redis.eval(
    VERIFY_OTP_SCRIPT,
    3,
    lockKey,
    otpKey,
    attemptsKey,
    submittedHash,
    MAX_ATTEMPTS,
    LOCK_DURATION
  );

  if (result === 1) {
    return { success: true };
  }

  if (result === -1 || result === -2) {
    throw new Error("Too many incorrect attempts. Please try again later.");
  }

  throw new Error("Invalid or expired OTP");
}
