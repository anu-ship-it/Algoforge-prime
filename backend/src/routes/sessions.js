const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const sessionController = require("../controllers/sessionController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post(
  "/",
  [
    body("problem_id").isUUID().withMessage("Valid problem_id UUID is required"),
    body("language").notEmpty().isIn(["javascript","python","java","cpp","c","go","rust","typescript","ruby","swift","kotlin"]).withMessage("Unsupported language"),
    body("interviewer_persona").optional().isIn(["generic","google","amazon","meta","microsoft"]),
    body("target_company").optional().trim().isLength({ max: 100 }),
  ],
  sessionController.create
);

router.get("/", sessionController.listByUser);
router.get("/:id", sessionController.getById);
router.post("/:id/complete", sessionController.complete);
router.post("/:id/abandon", sessionController.abandon);

module.exports = router;
