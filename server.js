const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Example rated wattages. Replace with the wattage printed on each appliance.
const APPLIANCE_WATTS = {
    tv: 100,
    washing: 500,
    light: 9,
    fridge: 150,
    fan: 75
};

// Used only for a rough appliance-level cost estimate.
// This is NOT the final household slab tariff.
const ESTIMATED_BASE_RATE = 4.70;

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

// Convert wattage and runtime into kWh (electricity units).
function calculateUnits(appliance, seconds) {
    const watts = APPLIANCE_WATTS[appliance];

    return (watts * seconds) / 3600000;
}

// Get saved usage history.

app.get("/api/usage", function (req, res) {
    const sql = "SELECT * FROM usage_records ORDER BY id DESC";

    db.query(sql, function (err, results) {
        if (err) {
            console.error("MYSQL HISTORY ERROR:", err);
            
            // Development debugging only
            return res.status(500).json({
                error: err.message,
                code: err.code
            });
        }

        res.json(results);
    });
});

// Save appliance usage.
app.post("/api/usage", function (req, res) {
    const { appliance, seconds } = req.body;

    if (
        !Object.prototype.hasOwnProperty.call(
            APPLIANCE_WATTS,
            appliance
        ) ||
        !Number.isSafeInteger(seconds) ||
        seconds < 0
    ) {
        return res.status(400).json({
            error: "Invalid appliance or seconds"
        });
    }

    const watts = APPLIANCE_WATTS[appliance];

    const units = calculateUnits(appliance, seconds);

    // Approximate appliance cost only.
    // Household slab/free-unit benefits are not applied here.
    const amount = units * ESTIMATED_BASE_RATE;

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
                console.error("Usage save failed:", err.message);

                return res.status(500).json({
                    error: "Failed to save usage"
                });
            }

            res.status(201).json({
                message: "Usage saved successfully",
                id: result.insertId,
                appliance: appliance,
                seconds: seconds,
                watts: watts,
                units: Number(units.toFixed(6)),
                amount: Number(amount.toFixed(2))
            });
        }
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`);
});
