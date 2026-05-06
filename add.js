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
  ALTER TABLE food_orders
  ADD COLUMN delivery_name TEXT
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