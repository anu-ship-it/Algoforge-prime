const jwt = require("jsonwebtoken");
const { getSessionContext, setSessionContext } = require("../config/redis");
const { generateInterviewerResponse } = require("./interviewerService");
const Session = require("../models/Session");

function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    socket.on("join_session", async ({ sessionId }) => {
      try {
        if (!sessionId) return socket.emit("error", { message: "sessionId is required" });
        const session = await Session.findByIdAndUser(sessionId, socket.user.id);
        if (!session) return socket.emit("error", { message: "Session not found" });
        if (session.status !== "active") return socket.emit("error", { message: "Session is no longer active" });

        socket.sessionId = sessionId;
        socket.join(`session:${sessionId}`);
        socket.emit("session_joined", { sessionId });
        console.log(`${socket.user.username} joined session ${sessionId}`);
      } catch (err) {
        console.error("join_session error:", err.message);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    socket.on("candidate_message", async ({ message, currentCode }) => {
      if (!socket.sessionId) return socket.emit("error", { message: "Join a session first" });
      if (!message?.trim()) return socket.emit("error", { message: "Message cannot be empty" });

      try {
        await Session.saveMessage({
          sessionId: socket.sessionId,
          role: "candidate",
          content: message,
          codeSnapshot: currentCode || null,
        });

        const context = await getSessionContext(socket.sessionId);
        if (!context) {
          return socket.emit("error", { message: "Session context expired. Please start a new session." });
        }

        socket.emit("interviewer_typing", true);
        const response = await generateInterviewerResponse(context, message, currentCode);
        await setSessionContext(socket.sessionId, context);

        await Session.saveMessage({
          sessionId: socket.sessionId,
          role: "interviewer",
          content: response,
        });

        socket.emit("interviewer_typing", false);
        socket.emit("interviewer_message", {
          role: "interviewer",
          content: response,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("candidate_message error:", err.message);
        socket.emit("interviewer_typing", false);
        socket.emit("error", { message: err.message || "Failed to get interviewer response" });
      }
    });

    socket.on("code_snapshot", async ({ code, language }) => {
      if (!socket.sessionId || !code) return;
      try {
        await Session.saveSnapshot({ sessionId: socket.sessionId, code, language });
      } catch (err) {
        console.error("Snapshot save error:", err.message);
      }
    });

    socket.on("request_hint", async ({ currentCode }) => {
      if (!socket.sessionId) return;
      try {
        const context = await getSessionContext(socket.sessionId);
        if (!context) return socket.emit("error", { message: "Session context expired" });

        socket.emit("interviewer_typing", true);
        const hintMessage = "I would like a hint please.";
        const response = await generateInterviewerResponse(context, hintMessage, currentCode);
        await setSessionContext(socket.sessionId, context);

        await Session.saveMessage({ sessionId: socket.sessionId, role: "candidate", content: hintMessage });
        await Session.saveMessage({ sessionId: socket.sessionId, role: "interviewer", content: response });

        socket.emit("interviewer_typing", false);
        socket.emit("interviewer_message", {
          role: "interviewer",
          content: response,
          timestamp: new Date().toISOString(),
          isHint: true,
        });
      } catch (err) {
        console.error("request_hint error:", err.message);
        socket.emit("interviewer_typing", false);
        socket.emit("error", { message: "Failed to get hint" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.user?.username} — ${reason}`);
    });
  });
}

module.exports = { registerSocketHandlers };
