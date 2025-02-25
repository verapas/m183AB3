const { body, validationResult } = require("express-validator");
const {hash} = require("bcrypt");

const saltRounds = 150;

const login = async (req, res) => {
    // Validierungsergebnisse prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Eingaben.",
            errors: errors.array()
        });
    }

    const { username, password } = req.body;

    try {
        // Passwort mit bcrypt hashen
        const hashedPassword = await hash(password, saltRounds);
        const answer = `
      <h1>Answer</h1>
      <p>Username: ${username}</p>
      <p>Password (gehasht): ${hashedPassword}</p>
    `;
        res.send(answer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Interner Serverfehler");
    }
};

const initializeAPI = async (app) => {
  app.post(
      "/api/login",
      [
        body("username")
            .notEmpty().withMessage("Username is required")
            .isEmail().withMessage("Username must be a valid email")
            .toLowerCase()
            .trim()
            .escape(),
        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 10 }).withMessage("Password must be at least 10 characters long")
            .trim()
            .escape()
      ],
      login
  );
};

module.exports = { initializeAPI };