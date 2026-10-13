// 30 seconds = 1 unit
// 1 unit = 1 rupee

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

// select appliance 

function selectAppliance(name, card) {

    document.querySelectorAll(".appliance").forEach(function(item) {
        item.classList.remove("active");
    });

    card.classList.add("active");

    // document.querySelectorAll(".details").forEach(function(item) {
    //     item.classList.remove("active");
    // });

    document.getElementById("details-" + name).classList.add("active");

}


// ON / OFF  

function changePower(name) {

    appliances[name].on =
        document.getElementById("power-" + name).checked;

    updateAll();

}


// Convert seconds into minutes and seconds

function getTime(seconds) {

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    return minutes + "m " + remainingSeconds + "s";

}


// Calculate unit based on seconds (30 seconds = 1 unit)

function getUnit(seconds) {

    return seconds / 30;

}


// Calculate amount based on seconds (1 unit = 1 rupee)

function getAmount(seconds) {

    return getUnit(seconds);

}


// Update each appliance

function updateAppliance(name) {

    let item = appliances[name];

    let unit = getUnit(item.seconds);
    let amount = getAmount(item.seconds);

    document.getElementById("power-" + name).checked = item.on;

    document.getElementById("powerText-" + name).innerText =
        item.on ? "Switch is ON" : "Switch is OFF";

    document.getElementById("time-" + name).innerText =
        getTime(item.seconds);

    document.getElementById("unit-" + name).innerText =
        unit.toFixed(2);

    document.getElementById("amount-" + name).innerText =
        amount.toFixed(2);


    // Appliance card status

    document.getElementById(name + "Status").innerText =
        item.on ? "ON" : "OFF";


    // Table values

    let formattedName =
        name.charAt(0).toUpperCase() + name.slice(1);

    document.getElementById("table" + formattedName + "Status").innerText =
        item.on ? "ON" : "OFF";

    document.getElementById("table" + formattedName + "Time").innerText =
        getTime(item.seconds);

    document.getElementById("table" + formattedName + "Unit").innerText =
        unit.toFixed(2);

    document.getElementById("table" + formattedName + "Amount").innerText =
        "₹" + amount.toFixed(2);

}


// Update total

function updateTotal() {

    let totalSeconds = 0;

    for (let name in appliances) {
        totalSeconds += appliances[name].seconds;
    }

    document.getElementById("totalUnit").innerText =
        getUnit(totalSeconds).toFixed(2);

    document.getElementById("totalAmount").innerText =
        getAmount(totalSeconds).toFixed(2);

}


// Update all appliances and total

function updateAll() {

    for (let name in appliances) {
        updateAppliance(name);
    }

    updateTotal();

}


// Turn all ON

function turnAllOn() {

    for (let name in appliances) {
        appliances[name].on = true;
    }

    updateAll();

}


// Turn all OFF

function turnAllOff() {

    for (let name in appliances) {
        appliances[name].on = false;
    }

    updateAll();

}


// Reset all data

function resetAll() {

    for (let name in appliances) {
        appliances[name].seconds = 0;
        appliances[name].on = false;
    }

    updateAll();

}


// Timer

setInterval(function() {

    for (let name in appliances) {

        if (appliances[name].on) {
            appliances[name].seconds++;
        }

    }

    updateAll();

}, 1000);


// Initial display

updateAll();

// document.getElementById("details-tv").classList.add("active");

function saveUsage(name) {
    let item = appliances[name];

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
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        console.log("Saved Successfully:",data);
        alert("Usage saved successfully!");
        if(typeof loadUsageHistory === "function") {
            loadUsageHistory();
        }
    })
    .catch(function(error) {
        console.log("Error:", error);
        alert("Saving usage failed: " + error.message);
    });
}

let allUsageRecords = [];
let showAllHistory = false;

//Load records from database

function loadUsageHistory() {

    fetch("/api/usage")
        .then(function(response) {
            return response.json();
        })
        .then(function(records) {

            allUsageRecords = records;
            showAllHistory = false;

            displayUsageHistory();
        })
        .catch(function(error) {
            console.log("History loading error:", error);
        });
    }

    // Display history

function displayUsageHistory() {
    let history = document.getElementById("usageHistory");
    let showMoreBtn = document.getElementById("showMorebtn");

    history.innerHTML = "";

//initially show only 5 records, if more than 5 records exist, show "Show More" button
    let recordsToShow = showAllHistory ? allUsageRecords : allUsageRecords.slice(0, 5);
    if(allUsageRecords.length === 0) {
        history.innerHTML = "<tr><td colspan='5'>No records found</td></tr>";
        showMoreBtn.style.display = "none";
        return;
    }

    recordsToShow.forEach(function(item) {

        let seconds = Number(item.seconds);
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds % 60;

        let values = [
            item.appliance,
            minutes + "m " + remainingSeconds + "s",
            Number(item.units).toFixed(2),
            "₹" + Number(item.amount).toFixed(2),
            new Date(item.created_at).toLocaleString()
        ];

        let row = document.createElement("tr");

        values.forEach(function(value) {
            let cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        history.appendChild(row);

    });

    // 5 mela records irundha button show more display pannum, otherwise hide pannum
    if(allUsageRecords.length > 5) {
        showMoreBtn.style.display = "inline-block";
        showMoreBtn.textContent = showAllHistory ? "Show Less" : "Show More";
    } else {
        showMoreBtn.style.display = "none";
    }
}

// see more and see less button 
function showMoreHistory() {
    showAllHistory = !showAllHistory;
    displayUsageHistory();
}

// Initial load 
loadUsageHistory();

//             let history = document.getElementById("usageHistory");

//             history.innerHTML = "";

//             if (records.length === 0) {
//                 history.innerHTML =
//                     "<tr><td colspan='5'>No records found</td></tr>";
//                 return;
//             }

//             records.forEach(function(item) {

//                 let seconds = Number(item.seconds);
//                 let minutes = Math.floor(seconds / 60);
//                 let remainingSeconds = seconds % 60;

//                 let row = document.createElement("tr");

//                 let values = [
//                     item.appliance,
//                     minutes + "m " + remainingSeconds + "s",
//                     Number(item.units).toFixed(2),
//                     "₹" + Number(item.amount).toFixed(2),
//                     new Date(item.created_at).toLocaleString()
//                 ];

//                 values.forEach(function(value) {
//                     let cell = document.createElement("td");
//                     cell.textContent = value;
//                     row.appendChild(cell);
//                 });

//                 history.appendChild(row);

//             });

//         })
//         .catch(function(error) {
//             console.log("History loading error:", error);
//         });
// }

// loadUsageHistory();