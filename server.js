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
            id,
            cart_list,
            total_price,
            order_number,
            delivery_name, 
            delivery_contact,
            delivery_address,
            status,
            created_at
        FROM food_orders
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching food orders:", err);
            return res.status(500).json({ error: "Database error" });
        }

        const formatted = rows.map(order => ({
            id: order.id,
            cart_list: order.cart_list ? JSON.parse(order.cart_list) : [],
            total_price: order.total_price,
            order_number: order.order_number || order.ORDER_NUMBER,
            delivery_name: order.delivery_name,
            delivery_contact: order.delivery_contact,
            delivery_address: order.delivery_address || order.DELIVERY_ADDRESS,
            status: order.status || "pending",

            // 🔥 FIX TIME FORMAT
            created_at: order.created_at
                ? new Date(order.created_at).toISOString()
                : null
        }));

        res.json(formatted);
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

    const { cart_list, total_price, order_number, delivery_name, delivery_contact, delivery_address } = req.body;

    db.run(
        `INSERT INTO food_orders 
        (cart_list, total_price, order_number, delivery_name, delivery_contact, delivery_address, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
            cart_list,
            total_price,
            order_number,
            delivery_name, 
            delivery_contact,
            delivery_address,
            "pending"
        ],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Order placed successfully",
                order_id: this.lastID
            });
        }
    );
});

app.patch('/food-orders/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ["pending", "preparing", "delivering", "delivered"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    db.run(
        `UPDATE food_orders SET status = ? WHERE id = ?`,
        [status, id],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to update status" });
            }

            res.json({
                message: "Status updated successfully",
                id,
                status
            });
        }
    );
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