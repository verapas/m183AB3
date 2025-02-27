const { body, validationResult } = require("express-validator");
const {hash, compare} = require("bcrypt");
const db = require('../db');
const {sign} = require("jsonwebtoken");
require('dotenv').config();

const saltRounds = 10;
const secretKey = process.env.JWT_SECRET
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Middleware zur Token-Authentifizierung
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Token fehlt" });
    }
    // Erwartetes Format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token fehlt" });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Ungültiges Token" });
        }
        // Überprüfen, ob die Rolle vorhanden ist und den Wert "viewer" hat
        if (!decoded.role || decoded.role !== "viewer") {
            return res.status(403).json({ message: "Forbidden: Ungültige Rolle" });
        }
        req.user = decoded;
        next();
    });
}

// Beispiel posts
const posts = [
    {
        id: 1,
        title: "Introduction to JavaScript",
        content: "JavaScript is a dynamic language primarily used for web development...",
    },
    {
        id: 2,
        title: "Functional Programming",
        content: "Functional programming is a paradigm where functions take center stage...",
    },
    {
        id: 3,
        title: "Asynchronous Programming in JS",
        content: "Asynchronous programming allows operations to run in parallel without blocking the main thread...",
    }
];

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
            // Kein Benutzer gefunden => 401 zurückgeben
            return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
        }

        try {
            // Vergleiche das eingegebene Passwort mit dem in der DB gespeicherten Hash
            const match = await bcrypt.compare(password, row.password);
            if (!match) {
                return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
            }
            // Authentifizierung erfolgreich: Token erzeugen
            const token = jwt.sign({ username: username, role: "viewer" }, secretKey, { expiresIn: "1h" });
            return res.send({ token });  // Wichtig: 'return' vor res.send, damit der Callback beendet wird
        } catch (error) {
            console.error(error);
            return res.status(500).send("Interner Serverfehler");
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
    // Geschützter GET-Endpunkt für Posts
    app.get("/api/posts", authenticateToken, (req, res) => {
        res.json(posts);
    });
};

module.exports = { initializeAPI, login };