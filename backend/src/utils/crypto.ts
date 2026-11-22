import {
  createHmac,
  createHash,
  randomInt,
  randomBytes
} from "node:crypto";

function getOTPSecret() {
  const secret = process.env.OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("OTP_SECRET must be at least 32 characters");
  }

  return secret;
}

export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashOTP(email: string, otp: string): string {
  return createHmac("sha256", getOTPSecret())
    .update(`${email}:${otp}`)
    .digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email)
    .digest("hex");
}