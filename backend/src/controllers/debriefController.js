const { query } = require("../config/db");
const Session = require("../models/Session");

async function generate(req, res) {
  try {
    const { sessionId } = req.params;
    const existing = await getDebrief(sessionId, req.user.id);
    if (existing) return res.json(existing);

    const session = await Session.findByIdAndUser(sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "completed") {
      return res.status(400).json({ error: "Session must be completed before generating a debrief" });
    }

    const messages = await Session.getMessages(sessionId);
    const snapshot = await Session.getLatestSnapshot(sessionId);

    const { generateDebriefReport } = require("../services/interviewerService");
    let debriefData;
    try {
      debriefData = await generateDebriefReport({
        session,
        messages,
        finalCode: session.final_code || snapshot?.code || "",
        problem: {
          title: session.problem_title,
          description: session.problem_description,
          difficulty: session.problem_difficulty,
          topic: session.problem_topic,
          constraints: session.problem_constraints,
        },
      });
    } catch (llmErr) {
      console.error("LLM debrief generation failed:", llmErr.message);
      debriefData = fallbackDebrief();
    }

    const saved = await saveDebrief(sessionId, req.user.id, debriefData);
    await updateUserSkills(req.user.id, session.problem_topic, debriefData.overall_score);
    res.json(saved);
  } catch (err) {
    console.error("Debrief generate error:", err);
    res.status(500).json({ error: "Failed to generate debrief" });
  }
}

async function get(req, res) {
  try {
    const debrief = await getDebrief(req.params.sessionId, req.user.id);
    if (!debrief) return res.status(404).json({ error: "Debrief not found" });
    res.json(debrief);
  } catch (err) {
    console.error("Debrief get error:", err);
    res.status(500).json({ error: "Failed to fetch debrief" });
  }
}

async function getDebrief(sessionId, userId) {
  const result = await query(
    "SELECT * FROM debrief_reports WHERE session_id = $1 AND user_id = $2",
    [sessionId, userId]
  );
  return result.rows[0] || null;
}

async function saveDebrief(sessionId, userId, data) {
  const result = await query(
    `INSERT INTO debrief_reports (
      session_id, user_id, overall_score, communication_score,
      correctness_score, efficiency_score, hire_recommendation,
      strengths, weaknesses, missed_edge_cases,
      optimal_solution, detailed_feedback
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      sessionId,
      userId,
      data.overall_score,
      data.communication_score,
      data.correctness_score,
      data.efficiency_score,
      data.hire_recommendation,
      data.strengths,
      data.weaknesses,
      data.missed_edge_cases,
      data.optimal_solution,
      data.detailed_feedback,
    ]
  );
  return result.rows[0];
}

async function updateUserSkills(userId, topic, score) {
  if (!topic) return;
  try {
    await query(
      `INSERT INTO user_skills (user_id, topic, attempts, successes, avg_score, last_practiced)
       VALUES ($1, $2, 1, $3, $4, NOW())
       ON CONFLICT (user_id, topic) DO UPDATE SET
         attempts       = user_skills.attempts + 1,
         successes      = user_skills.successes + $3,
         avg_score      = (user_skills.avg_score * user_skills.attempts + $4) / (user_skills.attempts + 1),
         last_practiced = NOW()`,
      [userId, topic, score >= 60 ? 1 : 0, score]
    );
  } catch (err) {
    console.error("Skill update error:", err.message);
  }
}

function fallbackDebrief() {
  return {
    overall_score: 50,
    communication_score: 50,
    correctness_score: 50,
    efficiency_score: 50,
    hire_recommendation: "no_hire",
    strengths: ["Completed the session"],
    weaknesses: ["Debrief could not be generated — try regenerating"],
    missed_edge_cases: [],
    optimal_solution: "Review the problem hints for the optimal approach",
    detailed_feedback: "The AI debrief service was unavailable. Your session data is saved — revisit this page to regenerate.",
  };
}

module.exports = { generate, get };
