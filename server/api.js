const { body, validationResult } = require("express-validator");
const db = require('../db');
require('dotenv').config();
const AesEncryption = require("aes-encryption");
const aes = new AesEncryption();
aes.setSecretKey(process.env.AES_SECRET);
const secretKey = process.env.JWT_SECRET;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

console.log("AES Secret:", process.env.AES_SECRET);

// Middleware zur Token-Authentifizierung
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Token fehlt" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token fehlt" });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Ungültiges Token" });
        }
        if (!decoded.role || decoded.role !== "viewer") {
            return res.status(403).json({ message: "Forbidden: Ungültige Rolle" });
        }
        req.user = decoded;
        next();
    });
}

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Eingaben.",
            errors: errors.array()
        });
    }
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Interner Serverfehler");
        }
        if (!row) {
            return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
        }
        try {
            const match = await bcrypt.compare(password, row.password);
            if (!match) {
                return res.status(401).send("Unauthorized: Benutzername oder Passwort ungültig");
            }
            const token = jwt.sign({ username: username, role: "viewer" }, secretKey, { expiresIn: "1h" });
            return res.send({ token });
        } catch (error) {
            console.error(error);
            return res.status(500).send("Interner Serverfehler");
        }
    });
};

const initializeAPI = async (app) => {
    // Login-Endpunkt
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

    // GET-Endpunkt: Posts abrufen und entschlüsseln
    app.get("/api/posts", authenticateToken, (req, res) => {
        db.all("SELECT * FROM posts", [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const decryptedPosts = rows.map(row => ({
                id: row.id,
                title: aes.decrypt(row.title),
                content: aes.decrypt(row.content)
            }));
            res.json(decryptedPosts);
        });
    });

    // POST-Endpunkt: Neuen Post speichern (verschlüsseln)
    app.post("/api/posts", authenticateToken, (req, res) => {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Titel und Inhalt sind erforderlich." });
        }
        const encryptedTitle = aes.encrypt(title);
        const encryptedContent = aes.encrypt(content);
        db.run("INSERT INTO posts (title, content) VALUES (?, ?)", [encryptedTitle, encryptedContent], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Post erfolgreich gespeichert", postId: this.lastID });
        });
    });
};

module.exports = { initializeAPI, login };