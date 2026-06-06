const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const debriefController = require("../controllers/debriefController");
const { authenticate } = require("../middleware/auth");

// All debrief routes require authentication
router.use(authenticate);

// POST /debrief/:sessionId
// Generate debrief for a completed session.
// Idempotent — returns existing debrief if already generated.
router.post(
  "/:sessionId",
  [
    param("sessionId")
      .isUUID()
      .withMessage("sessionId must be a valid UUID"),
  ],
  debriefController.generate
);

// GET /debrief/:sessionId
// Fetch an already-generated debrief
router.get(
  "/:sessionId",
  [
    param("sessionId")
      .isUUID()
      .withMessage("sessionId must be a valid UUID"),
  ],
  debriefController.get
);

module.exports = router;
