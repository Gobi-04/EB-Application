
const APPLIANCE_WATTS = {
    tv: 100,
    washing: 500,
    light: 9,
    fridge: 150,
    fan: 75
};

// Approximate base rate for appliance-level display only.
// Total bill uses the slab function below.
const ESTIMATED_BASE_RATE = 4.70;

let appliances = {
    tv: {
        name: "TV",
        seconds: 0,
        on: false
    },

    washing: {
        name: "Washing Machine",
        seconds: 0,
        on: false
    },

    light: {
        name: "Light",
        seconds: 0,
        on: false
    },

    fridge: {
        name: "Fridge",
        seconds: 0,
        on: false
    },

    fan: {
        name: "Fan",
        seconds: 0,
        on: false
    }
};

// Select appliance.
// Keeps previously opened appliance details visible.
function selectAppliance(name, card) {
    document.querySelectorAll(".appliance").forEach(function (item) {
        item.classList.remove("active");
    });

    card.classList.add("active");

    const details = document.getElementById("details-" + name);

    if (details) {
        details.classList.add("active");
    }
}

// ON / OFF
function changePower(name) {
    if (!appliances[name]) return;

    appliances[name].on =
        document.getElementById("power-" + name).checked;

    updateAll();
}

// Convert seconds into minutes and seconds.
function getTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return minutes + "m " + remainingSeconds + "s";
}

// Calculate estimated kWh.
// 1 unit = 1 kWh.
function getUnit(name) {
    const item = appliances[name];
    const watts = APPLIANCE_WATTS[name];

    return (watts * item.seconds) / 3600000;
}

// Approximate appliance-level cost.
// This does not apply the household's free-unit benefit.
function getAmount(name) {
    return getUnit(name) * ESTIMATED_BASE_RATE;
}

// Update an individual appliance and its table row.
function updateAppliance(name) {
    const item = appliances[name];

    const unit = getUnit(name);
    const amount = getAmount(name);

    document.getElementById("power-" + name).checked = item.on;

    document.getElementById("powerText-" + name).innerText =
        item.on ? "Switch is ON" : "Switch is OFF";

    document.getElementById("time-" + name).innerText =
        getTime(item.seconds);

    document.getElementById("unit-" + name).innerText =
        unit.toFixed(4);

    document.getElementById("amount-" + name).innerText =
        amount.toFixed(2);

    // Appliance card status.
    document.getElementById(name + "Status").innerText =
        item.on ? "ON" : "OFF";

    // Existing table IDs: tableTvStatus, tableWashingStatus, etc.
    const formattedName =
        name.charAt(0).toUpperCase() + name.slice(1);

    document.getElementById("table" + formattedName + "Status").innerText =
        item.on ? "ON" : "OFF";

    document.getElementById("table" + formattedName + "Time").innerText =
        getTime(item.seconds);

    document.getElementById("table" + formattedName + "Unit").innerText =
        unit.toFixed(4);

    document.getElementById("table" + formattedName + "Amount").innerText =
        "₹" + amount.toFixed(2);
}

// Estimate the Tamil Nadu domestic energy charge for a
// complete two-month billing-cycle consumption.
//
// These are configurable consumer-facing estimate rates.
// Check them against the current applicable tariff/subsidy
// and the actual bill for your connection.
function calculateTamilNaduBill(units) {
    units = Math.max(0, Number(units) || 0);

    let amount = 0;

    if (units <= 500) {
        // Eligible consumption up to 500 units:
        // first 200 units free.
        amount += Math.max(0, Math.min(units, 400) - 200) * 4.70;
        amount += Math.max(0, Math.min(units, 500) - 400) * 6.30;
    } else {
        // Consumption above 500 units:
        // first 100 units free.
        amount += Math.max(0, Math.min(units, 400) - 100) * 4.70;
        amount += Math.max(0, Math.min(units, 500) - 400) * 6.30;
        amount += Math.max(0, Math.min(units, 600) - 500) * 8.40;
        amount += Math.max(0, Math.min(units, 800) - 600) * 9.45;
        amount += Math.max(0, Math.min(units, 1000) - 800) * 10.50;
        amount += Math.max(0, units - 1000) * 11.55;
    }

    return Number(amount.toFixed(2));
}

// Update total units and estimated bill.
function updateTotal() {
    let totalUnits = 0;

    Object.keys(appliances).forEach(function (name) {
        totalUnits += getUnit(name);
    });

    const totalAmount = calculateTamilNaduBill(totalUnits);

    // Your HTML uses TotalUnit / TotalAmount.
    // Fallback also supports lowercase IDs if your HTML uses those.
    const unitElement =
        document.getElementById("totalUnit") ||
        document.getElementById("TotalUnit");

    const amountElement =
        document.getElementById("totalAmount") ||
        document.getElementById("TotalAmount");

    if (unitElement) {
        unitElement.innerText = totalUnits.toFixed(4);
    }

    if (amountElement) {
        amountElement.innerText = totalAmount.toFixed(2);
    }
}

// Update all appliances and the total.
function updateAll() {
    Object.keys(appliances).forEach(function (name) {
        updateAppliance(name);
    });

    updateTotal();
}

// Turn all ON.
function turnAllOn() {
    Object.keys(appliances).forEach(function (name) {
        appliances[name].on = true;
    });

    updateAll();
}

// Turn all OFF.
function turnAllOff() {
    Object.keys(appliances).forEach(function (name) {
        appliances[name].on = false;
    });

    updateAll();
}

// Reset timer values and turn all OFF.
// This does not delete records already saved in MySQL.
function resetAll() {
    Object.keys(appliances).forEach(function (name) {
        appliances[name].seconds = 0;
        appliances[name].on = false;
    });

    updateAll();
}

// Timer: increase seconds only while an appliance is ON.
setInterval(function () {
    Object.keys(appliances).forEach(function (name) {
        if (appliances[name].on) {
            appliances[name].seconds++;
        }
    });

    updateAll();
}, 1000);

// Initial display.
updateAll();

// Save appliance usage to MySQL.
function saveUsage(name) {
    const item = appliances[name];

    if (!item) {
        alert("Invalid appliance");
        return;
    }

    fetch("/api/usage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            appliance: name,
            seconds: item.seconds
        })
    })
    .then(async function (response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to save usage");
        }

        return data;
    })
    .then(function (data) {
        console.log("Saved successfully:", data);
        alert("Usage saved successfully!");

        loadUsageHistory();
    })
    .catch(function (error) {
        console.error("Saving error:", error);
        alert("Saving usage failed: " + error.message);
    });
}

let allUsageRecords = [];
let showAllHistory = false;

// Load saved records from MySQL.
function loadUsageHistory() {
    fetch("/api/usage")
        .then(async function (response) {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load history");
            }

            return data;
        })
        .then(function (records) {
            if (!Array.isArray(records)) {
                throw new Error("Unexpected history response");
            }

            allUsageRecords = records;
            showAllHistory = false;

            displayUsageHistory();
        })
        .catch(function (error) {
            console.error("History loading error:", error);
        });
}

// Display history.
function displayUsageHistory() {
    const history = document.getElementById("usageHistory");
    const showMoreBtn = document.getElementById("showMorebtn");

    if (!history || !showMoreBtn) {
        return;
    }

    history.innerHTML = "";

    // Initially show only 5 records.
    const recordsToShow = showAllHistory
        ? allUsageRecords
        : allUsageRecords.slice(0, 5);

    if (allUsageRecords.length === 0) {
        history.innerHTML =
            "<tr><td colspan='5'>No records found</td></tr>";

        showMoreBtn.style.display = "none";
        return;
    }

    recordsToShow.forEach(function (item) {
        const seconds = Number(item.seconds) || 0;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const parsedDate = item.created_at
            ? new Date(item.created_at)
            : null;

        const dateText =
            parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleString()
                : "Date unavailable";

        const values = [
            item.appliance,
            minutes + "m " + remainingSeconds + "s",
            (Number(item.units) || 0).toFixed(4),
            "₹" + (Number(item.amount) || 0).toFixed(2),
            dateText
        ];

        const row = document.createElement("tr");

        values.forEach(function (value) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        history.appendChild(row);
    });

    if (allUsageRecords.length > 5) {
        showMoreBtn.style.display = "inline-block";
        showMoreBtn.textContent = showAllHistory
            ? "Show Less"
            : "Show More";
    } else {
        showMoreBtn.style.display = "none";
    }
}

// Show More / Show Less.
function showMoreHistory() {
    showAllHistory = !showAllHistory;
    displayUsageHistory();
}

// Initial history load.
loadUsageHistory();
