
import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";

function getEncryptionKey(): Buffer {
  const secret = process.env.EMAIL_JOB_ENCRYPTION_KEY;

  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error(
      "EMAIL_JOB_ENCRYPTION_KEY must be a 64-character hex string"
    );
  }

  return Buffer.from(secret, "hex");
}

export function encryptEmailPayload(payload: {
  email: string;
  otp: string;
}) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: authTag.toString("hex")
  };
}

export function decryptEmailPayload(payload: {
  iv: string;
  data: string;
  tag: string;
}) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "hex")),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8")) as {
    email: string;
    otp: string;
  };
}
