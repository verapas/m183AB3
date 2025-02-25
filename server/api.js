const { body, validationResult } = require("express-validator");
const {hash, compare} = require("bcrypt");
const db = require('../db');

const saltRounds = 10;

const login = async (req, res) => {
    // Validierung der Eingaben prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Eingaben.",
            errors: errors.array()
        });
    }

    const { username, password } = req.body;

    // Suche den Benutzer in der Datenbank
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Interner Serverfehler");
        }
        if (!row) {
            return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
        }

        try {
            const match = await compare(password, row.password);
            if (!match) {
                return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
            }
            // Authentifizierung erfolgreich
            const answer = `
        <h1>Login erfolgreich</h1>
        <p>Willkommen, ${username}!</p>
      `;
            res.send(answer);
        } catch (error) {
            console.error(error);
            res.status(500).send("Interner Serverfehler");
        }
    });
};

const initializeAPI = async (app) => {
    app.post(
        "/api/login",
        [
            body("username")
                .notEmpty().withMessage("Username is required")
                .isEmail().withMessage("Username must be a valid email")
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

module.exports = { initializeAPI, login };