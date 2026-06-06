const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const { generate, get } = require("../controllers/debriefController");
const { authenticate } = require("../middleware/auth");

// All debrief routes require authentication
router.use(authenticate);

// POST /debrief/:sessionId
router.post(
  "/:sessionId",
  [
    param("sessionId")
      .isUUID()
      .withMessage("sessionId must be a valid UUID"),
  ],
  generate
);

// GET /debrief/:sessionId
router.get(
  "/:sessionId",
  [
    param("sessionId")
      .isUUID()
      .withMessage("sessionId must be a valid UUID"),
  ],
  get
);

module.exports = router;
