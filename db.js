const sqlite3 = require('sqlite3').verbose();

// creates or opens your database file
const db = new sqlite3.Database('./food.db', (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

module.exports = db;