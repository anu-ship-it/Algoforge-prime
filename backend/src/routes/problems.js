const express = require("express");
const router = express.Router();
const problemController = require("../controllers/problemController");
const { optionalAuth } = require("../middleware/auth");

router.get("/", optionalAuth, problemController.list);
router.get("/meta/topics", problemController.getTopics);
router.get("/meta/recommended", optionalAuth, problemController.getRecommended);
router.get("/:slug", optionalAuth, problemController.getBySlug);

module.exports = router;
