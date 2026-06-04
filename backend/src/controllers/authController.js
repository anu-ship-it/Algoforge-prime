const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const User = require("../models/User");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");
const { validate } = require("../utils/validate");

async function register(req, res) {
  if (!validate(req, res)) return;

  const { email, password, username, full_name } = req.body;

  try {
    const taken = await User.emailOrUsernameTaken(email, username);
    if (taken) {
      return res.status(409).json({ error: "Email or username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, username, fullName: full_name });
    const { accessToken, refreshToken } = generateTokens(user);

    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  if (!validate(req, res)) return;

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await storeRefreshToken(user.id, refreshToken);

    // Never send password hash to client
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Check token exists in DB and is not expired
    const result = await query(
      "SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()",
      [refreshToken]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Rotate — delete old, issue new
    await query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    const tokens = generateTokens(user);
    await storeRefreshToken(user.id, tokens.refreshToken);

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query(
      "DELETE FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    ).catch(() => {});
  }
  res.json({ message: "Logged out" });
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

// ── Helper ─────────────────────────────────────────────────
async function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
}

module.exports = { register, login, refresh, logout, me };
