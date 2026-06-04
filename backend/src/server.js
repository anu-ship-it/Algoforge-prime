require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");
const { registerSocketHandlers } = require("./services/socketService");

const authRoutes = require("./routes/auth");
const problemRoutes = require("./routes/problems");
const sessionRoutes = require("./routes/sessions");
const executionRoutes = require("./routes/execution");
const debriefRoutes = require("./routes/debrief");
const userRoutes = require("./routes/users");

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Routes ─────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/problems", problemRoutes);
app.use("/sessions", sessionRoutes);
app.use("/execute", executionRoutes);
app.use("/debrief", debriefRoutes);
app.use("/users", userRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Socket handlers ────────────────────────────────────────
registerSocketHandlers(io);

// ── Boot ───────────────────────────────────────────────────
async function start() {
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 AlgoForge backend running on port ${PORT}`);
    console.log(`🤖 Ollama: ${process.env.OLLAMA_URL}`);
    console.log(`⚡ Judge0: ${process.env.JUDGE0_URL}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
