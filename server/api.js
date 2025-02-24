const { body, validationResult } = require("express-validator");

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const answer = `
    <h1>Answer</h1>
    <p>Username: ${username}</p>
    <p>Password: ${password}</p>
  `;
  res.send(answer);
};

const initializeAPI = async (app) => {
  app.post(
      "/api/login",
      [
        body("username")
            .notEmpty().withMessage("Username is required")
            .isEmail().withMessage("Username must be a valid email"),
        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 10 }).withMessage("Password must be at least 10 characters long")
      ],
      login
  );
};

module.exports = { initializeAPI };