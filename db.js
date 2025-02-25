const sqlite3 = require('sqlite3').verbose();

// Erstellt oder öffnet die Datei "database.db" als SQLite-Datenbank
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Mit der SQLite-Datenbank verbunden.');
    }
});

module.exports = db;