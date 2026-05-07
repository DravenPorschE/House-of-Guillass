const db = require('./db');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/staff-delivery", (req, res) => {
    res.sendFile(path.join(__dirname, "public/pages", "staff_delivery.html"));
});

app.get('/food', (req, res) => {
    db.all("SELECT * FROM food", [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.get('/food-orders', (req, res) => {
    const sql = `
        SELECT 
            food_orders.id,
            user_accounts.full_name,   -- Borrowed from user table
            user_accounts.phone_number, -- Borrowed from user table
            food_orders.cart_list,
            food_orders.total_price,
            food_orders.order_number,
            food_orders.delivery_address,
            food_orders.status
        FROM food_orders
        JOIN user_accounts ON food_orders.user_id = user_accounts.user_id
        ORDER BY food_orders.id DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/food/:id', (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM food WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(row);
        }
    });
});

app.post('/food', (req, res) => {
    const { food_name, food_price, category, is_food_deal, food_items } = req.body;

    db.run(
        `INSERT INTO food (food_name, food_price, category, is_food_deal, food_items)
         VALUES (?, ?, ?, ?, ?)`,
        [
            food_name,
            food_price,
            category,
            is_food_deal,
            food_items ? JSON.stringify(food_items) : null
        ],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    message: "Food added successfully",
                    id: this.lastID
                });
            }
        }
    );
});

app.post('/checkout', (req, res) => {
    // 1. Remove delivery_name and delivery_contact from destructuring
    const { user_id, cart_list, total_price, order_number, delivery_address } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required to place an order" });
    }

    // 2. Updated SQL: Removed delivery_name and delivery_contact columns and placeholders (?)
    const sql = `INSERT INTO food_orders 
        (user_id, cart_list, total_price, order_number, delivery_address, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;

    db.run(
        sql,
        [
            user_id, 
            JSON.stringify(cart_list), 
            total_price,
            order_number,
            delivery_address, // Now we only save the specific address for this order
            "pending"
        ],
        function (err) {
            if (err) {
                console.error("Checkout Error:", err.message);
                return res.status(500).json({ error: "Failed to place order." });
            }

            res.json({
                message: "Order placed successfully",
                order_id: this.lastID
            });
        }
    );
});

app.patch('/food-orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, staff_id } = req.body; 

    // Ensure staff_id is included in the UPDATE statement
    const sql = `
        UPDATE food_orders 
        SET status = ?, staff_id = ? 
        WHERE id = ?
    `;

    db.run(sql, [status, staff_id, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Send back the data to verify it was received
        res.json({ 
            message: 'Status updated successfully', 
            id: id, 
            status: status,
            staff_id: staff_id // Add this to your response for testing!
        });
    });
});

app.post('/reservation', (req, res) => {
    const { reservation_id, full_name, contact_number, reservation_date, guests, reservation_time } = req.body;

    if (!full_name || !reservation_date || !guests || !contact_number || !reservation_id || !reservation_time) {
        return res.status(400).json({ error: "Missing fields" });
    }

    db.run(
        `INSERT INTO reservations 
        (reservation_id, full_name, contact_number, reservation_date, guests, reservation_time)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [reservation_id, full_name, contact_number, reservation_date, guests, reservation_time],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Reservation successful",
                reservation_id: reservation_id
            });
        }
    );
});

app.post("/create-account", (req, res) => {
    // 1. Pull the new fields from req.body
    const { full_name, phone_number, username, email, password } = req.body;

    // 2. Basic validation
    if (!username || !email || !password || !full_name || !phone_number) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // 3. Updated SQL query to include the new columns
    const sql = `INSERT INTO user_accounts (full_name, phone_number, username, email, password) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [full_name, phone_number, username, email, password], function (err) {
        if (err) {
            console.error(err.message);
            // This usually happens if the email or username is already taken
            return res.status(500).json({ error: "Account creation failed. Email or Username might already exist." });
        }
        
        res.json({ 
            message: "Account created successfully", 
            user_id: this.lastID 
        });
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    }

    // CHANGE: 'users' -> 'user_accounts' AND 'id' -> 'user_id'
    const sql = "SELECT user_id, username, full_name, email, phone_number FROM user_accounts WHERE username = ? AND password = ?";
    
    db.get(sql, [username, password], (err, user) => {
        if (err) {
            console.error("Login DB Error:", err.message); // Always log the actual error!
            return res.status(500).json({ error: "Database error" });
        }

        if (user) {
            res.json({
                user_id: user.user_id, // Match the column name
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone_number
            });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    });
});

app.get("/fetch-account/:id", (req, res) => {
    const userId = req.params.id;

    // We only select the columns we need for privacy and efficiency
    const sql = "SELECT full_name, phone_number, email, username FROM user_accounts WHERE user_id = ?";

    db.get(sql, [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (!row) {
            return res.status(404).json({ error: "User not found" });
        }

        // Send the user data back to the frontend
        res.json(row);
    });
});

app.get('/latest-active-order/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT 
            food_orders.order_number, 
            food_orders.delivery_address, 
            food_orders.status,
            user_accounts.full_name as delivery_name,
            user_accounts.phone_number as delivery_contact
        FROM food_orders
        JOIN user_accounts ON food_orders.user_id = user_accounts.user_id
        WHERE food_orders.user_id = ? AND food_orders.status != 'delivered'
        ORDER BY food_orders.id DESC
        LIMIT 1
    `;

    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // If no active order is found, row will be undefined
        res.json(row || null);
    });
});

// STAFF SIGNUP
app.post('/staff-signup', (req, res) => {
    const { username, full_name, email, phone_number, password } = req.body;

    const sql = `INSERT INTO staff_accounts (username, full_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [username, full_name, email, phone_number, password], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(400).json({ error: "Username or Email already exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, staff_id: this.lastID });
    });
});

// STAFF LOGIN
app.post('/staff-login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM staff_accounts WHERE email = ? AND password = ?`;
    
    db.get(sql, [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row) {
            res.json({ 
                success: true, 
                staff_id: row.staff_id, 
                full_name: row.full_name 
            });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

app.post('/admin-login', (req, res) => {
    const { identifier, password } = req.body;

    // We check both username OR email
    const sql = `SELECT * FROM admin_accounts WHERE (username = ? OR email = ?) AND password = ?`;
    
    db.get(sql, [identifier, identifier, password], (err, admin) => {
        if (err) return res.status(500).json({ success: false, error: "Database error" });
        
        if (admin) {
            res.json({ 
                success: true, 
                token: 'admin-access-granted-' + admin.id // Simple token for demo
            });
        } else {
            res.status(401).json({ success: false, error: "Unauthorized access" });
        }
    });
});

// 1. Get all Users
app.get('/admin/users', (req, res) => {
    db.all("SELECT user_id, full_name, email, phone_number FROM user_accounts", [], (err, rows) => {
        res.json(rows);
    });
});

// 2. Get all Staff + Delivery Count
app.get('/admin/staff', (req, res) => {
    const sql = `
        SELECT 
            staff_accounts.staff_id, 
            staff_accounts.full_name, 
            staff_accounts.email,
            COUNT(food_orders.id) as delivery_count
        FROM staff_accounts
        LEFT JOIN food_orders ON staff_accounts.staff_id = food_orders.staff_id 
        AND food_orders.status = 'delivered'
        GROUP BY staff_accounts.staff_id
    `;
    db.all(sql, [], (err, rows) => {
        res.json(rows);
    });
});

// 3. Reset Password (Universal)
app.post('/admin/reset-password', (req, res) => {
    const { type, id, newPass } = req.body;
    const table = (type === 'staff') ? 'staff_accounts' : 'user_accounts';
    const idColumn = (type === 'staff') ? 'staff_id' : 'user_id';

    const sql = `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`;
    
    db.run(sql, [newPass, id], function(err) {
        if (err) return res.status(500).json({ error: "Update failed" });
        res.json({ success: true, message: "Password updated successfully!" });
    });
});

app.get('/admin/staff-history/:staffId', (req, res) => {
    const staffId = req.params.staffId;
    
    // Updated SQL to use ORDER_NUMBER and added uppercase aliases 
    // to match your JS "bulletproof" mapping logic
    const sql = `
        SELECT 
            id, 
            ORDER_NUMBER, 
            created_at, 
            total_price, 
            cart_list, 
            status 
        FROM food_orders 
        WHERE staff_id = ? 
        ORDER BY created_at DESC
    `;
    
    db.all(sql, [staffId], (err, rows) => {
        if (err) {
            console.error("History Fetch Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // Success: 'rows' will now contain 'ORDER_NUMBER'
        res.json(rows);
    });
});

app.delete('/food/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM food WHERE id = ?", [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: "Deleted successfully" });
        }
    });
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});