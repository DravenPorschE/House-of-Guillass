const sqlite3 = require("sqlite3").verbose();

// Open database (creates file if it doesn't exist)
const db = new sqlite3.Database("./food.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// SQL to alter table
const sql = `
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,               -- The Foreign Key
    full_name TEXT NOT NULL,
    reservation_date TEXT NOT NULL,
    RESERVATION_TIME TEXT NOT NULL,
    guests TEXT,
    CONTACT_NUMBER TEXT,
    RESERVATION_ID TEXT,                    -- Your custom unique ID (e.g., RSVN-123)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Defining the relationship
    FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) 
        ON DELETE CASCADE
);
`;

// Execute query
db.run(sql, function (err) {
  if (err) {
    console.error("Error altering table:", err.message);
  } else {
    console.log("Column added successfully!");
  }
});

// Close connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Database connection closed.");
  }
});