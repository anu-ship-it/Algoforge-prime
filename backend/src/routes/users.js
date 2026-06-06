const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

// All user routes require authentication
router.use(authenticate);

// GET /users/profile
// Full profile: user data + skill graph + aggregate stats + activity
router.get("/profile", userController.getProfile);

// GET /users/recommended-problem
// Returns next problem based on user's weakest topic
router.get("/recommended-problem", userController.getRecommendedProblem);

// GET /users/skills
// Just the skill graph — used for the dashboard skill widget
router.get("/skills", userController.getSkills);

module.exports = router;
