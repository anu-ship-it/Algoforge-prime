const Problem = require("../models/Problem");

async function list(req, res) {
  try {
    const { difficulty, topic, company, limit, offset } = req.query;

    const result = await Problem.findAll({
      difficulty,
      topic,
      company,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json(result);
  } catch (err) {
    console.error("Problem list error:", err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
}

async function getBySlug(req, res) {
  try {
    const problem = await Problem.findBySlug(req.params.slug);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }
    res.json(problem);
  } catch (err) {
    console.error("Problem fetch error:", err);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
}

async function getTopics(req, res) {
  try {
    const topics = await Problem.getTopics();
    res.json(topics);
  } catch (err) {
    console.error("Topics fetch error:", err);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
}

async function getRecommended(req, res) {
  try {
    // req.user may be undefined if called without auth
    const userId = req.user?.id || null;
    const problem = await Problem.getRecommended(userId);
    if (!problem) {
      return res.status(404).json({ error: "No problems found" });
    }
    res.json(problem);
  } catch (err) {
    console.error("Recommended fetch error:", err);
    res.status(500).json({ error: "Failed to fetch recommendation" });
  }
}

module.exports = { list, getBySlug, getTopics, getRecommended };
