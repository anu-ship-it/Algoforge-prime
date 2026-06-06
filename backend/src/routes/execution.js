const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const executionController = require("../controllers/executionController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post(
  "/",
  [
    body("code").notEmpty().withMessage("code is required"),
    body("language").notEmpty().isIn(["javascript","python","java","cpp","c","go","rust","typescript","ruby","swift","kotlin"]).withMessage("Unsupported language"),
    body("stdin").optional().isString(),
    body("session_id").optional().isUUID(),
  ],
  executionController.run
);

router.post(
  "/run-tests",
  [
    body("code").notEmpty().withMessage("code is required"),
    body("language").notEmpty().isIn(["javascript","python","java","cpp","c","go","rust","typescript","ruby","swift","kotlin"]).withMessage("Unsupported language"),
    body("problem_id").isUUID().withMessage("Valid problem_id UUID is required"),
  ],
  executionController.runTests
);

module.exports = router;
