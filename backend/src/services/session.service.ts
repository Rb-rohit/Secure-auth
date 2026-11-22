import redis from "../config/redis.js";

import {
  generateSessionToken,
  hashToken
} from "../utils/crypto.js";

const SESSION_TTL = 7 * 24 * 60 * 60;

export interface SessionData {
  userId: string;
  createdAt: string;
  userAgent: string;
  ip: string;
}

function sessionKey(hash: string) {
  return `auth:session:${hash}`;
}

function userSessionsKey(userId: string) {
  return `auth:user-sessions:${userId}`;
}

export async function createSession(
  userId: string,
  userAgent: string,
  ip: string
) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);

  const session: SessionData = {
    userId,
    createdAt: new Date().toISOString(),
    userAgent,
    ip
  };

  await redis
    .multi()
    .set(
      sessionKey(tokenHash),
      JSON.stringify(session),
      "EX",
      SESSION_TTL
    )
    .sadd(userSessionsKey(userId), tokenHash)
    .zadd(
      `auth:session-activity:${userId}`,
      Date.now(),
      tokenHash
    )
    .expire(
      userSessionsKey(userId),
      SESSION_TTL
    )
    .expire(
      `auth:session-activity:${userId}`,
      SESSION_TTL
    )
    .exec();

  return {
    token,
    session
  };
}

export async function getSession(token: string) {
  const tokenHash = hashToken(token);

  const data = await redis.get(sessionKey(tokenHash));

  if (!data) {
    return null;
  }

  return {
    tokenHash,
    data: JSON.parse(data) as SessionData
  };
}

export async function listSessions(userId: string) {
  const hashes = await redis.zrevrange(
    `auth:session-activity:${userId}`,
    0,
    -1
  );

  const sessions = [];

  for (const hash of hashes) {
    const data = await redis.get(sessionKey(hash));

    if (!data) {
      await redis
        .multi()
        .srem(userSessionsKey(userId), hash)
        .zrem(`auth:session-activity:${userId}`, hash)
        .exec();

      continue;
    }

    sessions.push({
      id: hash,
      ...(JSON.parse(data) as SessionData)
    });
  }

  return sessions;
}

export async function revokeSession(
  userId: string,
  tokenHash: string
) {
  const key = sessionKey(tokenHash);
  const data = await redis.get(key);

  if (!data) {
    return false;
  }

  const session = JSON.parse(data) as SessionData;

  if (session.userId !== userId) {
    return false;
  }

  await redis
    .multi()
    .del(key)
    .srem(userSessionsKey(userId), tokenHash)
    .zrem(`auth:session-activity:${userId}`, tokenHash)
    .exec();

  return true;
}

export async function revokeAllSessions(userId: string) {
  const hashes = await redis.smembers(
    userSessionsKey(userId)
  );

  const transaction = redis.multi();

  for (const hash of hashes) {
    transaction.del(sessionKey(hash));
  }

  transaction.del(userSessionsKey(userId));
  transaction.del(`auth:session-activity:${userId}`);

  await transaction.exec();
}