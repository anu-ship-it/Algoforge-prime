const { createClient } = require("redis");

let client;

async function connectRedis() {
  client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on("error", (err) => console.error("Redis error:", err));

  await client.connect();
  console.log("✅ Redis connected");
}

function getRedis() {
  if (!client) throw new Error("Redis not initialized — call connectRedis() first");
  return client;
}

// ── Interview context window ───────────────────────────────
// Stores the full LLM message history for an active session.
// TTL = 2 hours. If a session goes idle that long, context is lost
// and the user must start a new session.

async function setSessionContext(sessionId, context, ttlSeconds = 7200) {
  const redis = getRedis();
  await redis.setEx(
    `session:context:${sessionId}`,
    ttlSeconds,
    JSON.stringify(context)
  );
}

async function getSessionContext(sessionId) {
  const redis = getRedis();
  const data = await redis.get(`session:context:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteSessionContext(sessionId) {
  const redis = getRedis();
  await redis.del(`session:context:${sessionId}`);
}

// ── Rate limiting ──────────────────────────────────────────
async function incrementUserRequests(userId, windowSeconds = 3600) {
  const redis = getRedis();
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  const count = await redis.incr(key);
  await redis.expire(key, windowSeconds);
  return count;
}

module.exports = {
  connectRedis,
  getRedis,
  setSessionContext,
  getSessionContext,
  deleteSessionContext,
  incrementUserRequests,
};
