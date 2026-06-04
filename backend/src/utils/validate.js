const { validationResult } = require("express-validator");

// Call this at the top of any controller that uses express-validator rules.
// Returns true if valid, sends 400 and returns false if not.
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
    return false;
  }
  return true;
}

// Individual field validators reused across routes
const rules = {
  email: require("express-validator").body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),

  password: require("express-validator").body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  username: require("express-validator").body("username")
    .isLength({ min: 3, max: 30 })
    .isAlphanumeric()
    .withMessage("Username must be 3-30 alphanumeric characters"),

  requiredString: (field) =>
    require("express-validator").body(field)
      .notEmpty()
      .trim()
      .withMessage(`${field} is required`),

  uuid: (field) =>
    require("express-validator").body(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`),
};

module.exports = { validate, rules };
