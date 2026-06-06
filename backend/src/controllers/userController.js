const { query } = require("../config/db");
const User = require("../models/User");
const Problem = require("../models/Problem");

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Skill graph
    const skillsResult = await query(
      `SELECT topic, attempts, successes, avg_score, last_practiced
       FROM user_skills
       WHERE user_id = $1
       ORDER BY avg_score ASC`,
      [req.user.id]
    );

    // Aggregate stats
    const statsResult = await query(
      `SELECT
         COUNT(*)                                                    AS total_sessions,
         COUNT(*) FILTER (WHERE s.status = 'completed')             AS completed_sessions,
         COUNT(*) FILTER (WHERE s.status = 'abandoned')             AS abandoned_sessions,
         ROUND(AVG(dr.overall_score))                               AS avg_score,
         COUNT(*) FILTER (WHERE dr.hire_recommendation IN ('hire', 'strong_hire')) AS hire_count,
         COUNT(*) FILTER (WHERE dr.hire_recommendation IN ('no_hire', 'strong_no_hire')) AS no_hire_count
       FROM sessions s
       LEFT JOIN debrief_reports dr ON s.id = dr.session_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    // Recent activity — last 7 days
    const activityResult = await query(
      `SELECT
         DATE(s.created_at) AS date,
         COUNT(*)           AS sessions_count
       FROM sessions s
       WHERE s.user_id = $1
         AND s.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(s.created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    res.json({
      user,
      skills: skillsResult.rows,
      stats: statsResult.rows[0],
      activity: activityResult.rows,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

async function getRecommendedProblem(req, res) {
  try {
    const problem = await Problem.getRecommended(req.user.id);
    if (!problem) {
      return res.status(404).json({ error: "No problems available" });
    }
    res.json(problem);
  } catch (err) {
    console.error("Recommended problem error:", err);
    res.status(500).json({ error: "Failed to fetch recommendation" });
  }
}

async function getSkills(req, res) {
  try {
    const result = await query(
      `SELECT topic, attempts, successes, avg_score, last_practiced
       FROM user_skills
       WHERE user_id = $1
       ORDER BY last_practiced DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get skills error:", err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
}

module.exports = { getProfile, getRecommendedProblem, getSkills };
