const { query } = require("../config/db");

const Session = {
  async create({ userId, problemId, language, interviewerPersona, targetCompany }) {
    const result = await query(
      `INSERT INTO sessions (user_id, problem_id, language, interviewer_persona, target_company)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, problemId, language, interviewerPersona || "generic", targetCompany || null]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT s.*,
              p.title        AS problem_title,
              p.description  AS problem_description,
              p.difficulty   AS problem_difficulty,
              p.topic        AS problem_topic,
              p.constraints  AS problem_constraints,
              p.starter_code AS problem_starter_code,
              p.hints        AS problem_hints
       FROM sessions s
       LEFT JOIN problems p ON s.problem_id = p.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await query(
      `SELECT s.id, s.status, s.language, s.interviewer_persona,
              s.started_at, s.ended_at, s.duration_seconds, s.created_at,
              p.title      AS problem_title,
              p.difficulty AS problem_difficulty,
              p.topic      AS problem_topic,
              dr.overall_score,
              dr.hire_recommendation
       FROM sessions s
       LEFT JOIN problems p  ON s.problem_id  = p.id
       LEFT JOIN debrief_reports dr ON s.id = dr.session_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [userId]
    );
    return result.rows;
  },

  async findByIdAndUser(id, userId) {
    const result = await query(
      "SELECT * FROM sessions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async complete(id, finalCode) {
    const result = await query(
      `UPDATE sessions
       SET status = 'completed',
           ended_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
           final_code = $1
       WHERE id = $2
       RETURNING *`,
      [finalCode || null, id]
    );
    return result.rows[0] || null;
  },

  async abandon(id) {
    const result = await query(
      `UPDATE sessions
       SET status = 'abandoned',
           ended_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  async saveMessage({ sessionId, role, content, codeSnapshot }) {
    const result = await query(
      `INSERT INTO session_messages (session_id, role, content, code_snapshot)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, role, content, codeSnapshot || null]
    );
    return result.rows[0];
  },

  async getMessages(sessionId) {
    const result = await query(
      `SELECT * FROM session_messages
       WHERE session_id = $1
       ORDER BY timestamp ASC`,
      [sessionId]
    );
    return result.rows;
  },

  async saveSnapshot({ sessionId, code, language, executionResult }) {
    await query(
      `INSERT INTO code_snapshots (session_id, code, language, execution_result)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, code, language, executionResult ? JSON.stringify(executionResult) : null]
    );
  },

  async getLatestSnapshot(sessionId) {
    const result = await query(
      `SELECT * FROM code_snapshots
       WHERE session_id = $1
       ORDER BY captured_at DESC
       LIMIT 1`,
      [sessionId]
    );
    return result.rows[0] || null;
  },
};

module.exports = Session;
