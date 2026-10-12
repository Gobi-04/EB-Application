const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(function (err) {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

app.get("/api/usage", function (req, res) {
    const sql = "SELECT * FROM usage_records ORDER BY id DESC";

    db.query(sql, function (err, results) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

app.post("/api/usage", function (req, res) {
    const { appliance, seconds } = req.body;

    const validAppliances = [
        "tv",
        "washing",
        "light",
        "fridge",
        "fan"
    ];

    if (
        !validAppliances.includes(appliance) ||
        !Number.isInteger(seconds) ||
        seconds < 0
    ) {
        return res.status(400).json({
            error: "Invalid appliance or seconds"
        });
    }

    const units = seconds / 30;
    const amount = units;

    const sql = `
        INSERT INTO usage_records
        (appliance, seconds, units, amount)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [appliance, seconds, units, amount],
        function (err, result) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Usage saved successfully",
                id: result.insertId,
                appliance: appliance,
                seconds: seconds,
                units: units,
                amount: amount
            });
        }
    );
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server running at http://localhost:3000");
});