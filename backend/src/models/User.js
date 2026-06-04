const { query } = require("../config/db");

const User = {
  async findByEmail(email) {
    const result = await query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  },

  async findByUsername(username) {
    const result = await query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      `SELECT id, email, username, full_name, avatar_url,
              is_premium, sessions_used_this_month, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ email, passwordHash, username, fullName }) {
    const result = await query(
      `INSERT INTO users (email, password_hash, username, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, full_name, is_premium, sessions_used_this_month, created_at`,
      [email, passwordHash, username, fullName || null]
    );
    return result.rows[0];
  },

  async emailOrUsernameTaken(email, username) {
    const result = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    return result.rows.length > 0;
  },

  async incrementSessionCount(userId) {
    await query(
      "UPDATE users SET sessions_used_this_month = sessions_used_this_month + 1 WHERE id = $1",
      [userId]
    );
  },

  async getSessionCount(userId) {
    const result = await query(
      "SELECT sessions_used_this_month, is_premium FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0] || null;
  },
};

module.exports = User;
