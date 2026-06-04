const { query } = require("../config/db");

const Problem = {
  async findAll({ difficulty, topic, company, limit = 20, offset = 0 }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (difficulty) {
      conditions.push(`difficulty = $${idx++}`);
      params.push(difficulty);
    }
    if (topic) {
      conditions.push(`topic = $${idx++}`);
      params.push(topic);
    }
    if (company) {
      conditions.push(`$${idx++} = ANY(company_tags)`);
      params.push(company);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT id, title, slug, difficulty, topic, company_tags, constraints
       FROM problems
       ${where}
       ORDER BY
         CASE difficulty
           WHEN 'easy' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'hard' THEN 3
         END,
         title ASC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM problems ${where}`,
      params
    );

    return {
      problems: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  async findBySlug(slug) {
    const result = await query(
      "SELECT * FROM problems WHERE slug = $1",
      [slug]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      "SELECT * FROM problems WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async getTopics() {
    const result = await query(
      `SELECT topic, COUNT(*) as count
       FROM problems
       GROUP BY topic
       ORDER BY topic ASC`
    );
    return result.rows;
  },

  async getRecommended(userId) {
    // Find the weakest topic for this user
    const skillResult = await query(
      `SELECT topic, avg_score
       FROM user_skills
       WHERE user_id = $1
       ORDER BY avg_score ASC
       LIMIT 1`,
      [userId]
    );

    let topic = "arrays";
    let difficulty = "easy";

    if (skillResult.rows.length > 0) {
      const weakest = skillResult.rows[0];
      topic = weakest.topic;
      difficulty =
        weakest.avg_score < 40 ? "easy" :
        weakest.avg_score < 70 ? "medium" : "hard";
    }

    // Get a random problem from that topic and difficulty
    const result = await query(
      `SELECT id, title, slug, difficulty, topic, company_tags
       FROM problems
       WHERE topic = $1 AND difficulty = $2
       ORDER BY RANDOM()
       LIMIT 1`,
      [topic, difficulty]
    );

    // Fallback — any random problem if no match
    if (result.rows.length === 0) {
      const fallback = await query(
        `SELECT id, title, slug, difficulty, topic, company_tags
         FROM problems
         ORDER BY RANDOM()
         LIMIT 1`
      );
      return fallback.rows[0] || null;
    }

    return result.rows[0];
  },
};

module.exports = Problem;
