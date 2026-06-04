const Session = require("../models/Session");
const Problem = require("../models/Problem");
const User = require("../models/User");
const { setSessionContext, deleteSessionContext } = require("../config/redis");
const { buildInitialContext } = require("../services/interviewerService");

async function create(req, res) {
  try {
    const { problem_id, language, interviewer_persona, target_company } = req.body;

    if (!problem_id || !language) {
      return res.status(400).json({ error: "problem_id and language are required" });
    }

    // Check free tier limit
    const userData = await User.getSessionCount(req.user.id);
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!userData.is_premium && userData.sessions_used_this_month >= 3) {
      return res.status(403).json({
        error: "Free tier limit reached",
        message: "You have used all 3 free sessions this month. Upgrade to premium for unlimited sessions.",
      });
    }

    // Fetch problem
    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Create session record
    const session = await Session.create({
      userId: req.user.id,
      problemId: problem_id,
      language,
      interviewerPersona: interviewer_persona || "generic",
      targetCompany: target_company || null,
    });

    // Increment usage counter
    await User.incrementSessionCount(req.user.id);

    // Build LLM context and store in Redis
    const context = buildInitialContext({
      problem,
      persona: interviewer_persona || "generic",
      language,
      targetCompany: target_company || null,
    });
    await setSessionContext(session.id, context);

    // Persist opening message to DB
    const openingMessage = context.messages[0].content;
    await Session.saveMessage({
      sessionId: session.id,
      role: "interviewer",
      content: openingMessage,
    });

    res.status(201).json({
      session,
      problem,
      openingMessage,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
}

async function getById(req, res) {
  try {
    const session = await Session.findByIdAndUser(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = await Session.getMessages(req.params.id);

    res.json({ session, messages });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
}

async function listByUser(req, res) {
  try {
    const sessions = await Session.findByUser(req.user.id);
    res.json(sessions);
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}

async function complete(req, res) {
  try {
    const { finalCode } = req.body;

    // Verify ownership before completing
    const existing = await Session.findByIdAndUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (existing.status === "completed") {
      return res.status(400).json({ error: "Session already completed" });
    }

    const session = await Session.complete(req.params.id, finalCode);

    // Clean up Redis context — no longer needed
    await deleteSessionContext(req.params.id);

    res.json(session);
  } catch (err) {
    console.error("Complete session error:", err);
    res.status(500).json({ error: "Failed to complete session" });
  }
}

async function abandon(req, res) {
  try {
    const existing = await Session.findByIdAndUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = await Session.abandon(req.params.id);
    await deleteSessionContext(req.params.id);

    res.json(session);
  } catch (err) {
    console.error("Abandon session error:", err);
    res.status(500).json({ error: "Failed to abandon session" });
  }
}

module.exports = { create, getById, listByUser, complete, abandon };
