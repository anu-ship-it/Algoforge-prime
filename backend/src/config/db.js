const { Pool } = require("pg");

let pool;

async function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!pool) throw new Error("Database not initialized — call connectDB() first");
  return pool;
}

async function query(text, params) {
  const db = getDB();
  return db.query(text, params);
}

module.exports = { connectDB, getDB, query };
