const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./food.db', (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
        
        // 🛡️ Wake up the guard: Enable Foreign Key constraints
        db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
            if (pragmaErr) {
                console.error("Failed to enable Foreign Keys:", pragmaErr.message);
            } else {
                console.log("Foreign Key enforcement is ACTIVE.");
            }
        });
    }
});

module.exports = db;