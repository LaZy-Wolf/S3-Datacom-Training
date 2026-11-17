// ===================== DATA =====================
const stations = ["Hyderabad (HYD)", "Kazipet (KZJ)", "Vijayawada (BZA)", "Chennai (MAS)", "Bengaluru (SBC)", "Mumbai (CSMT)", "Pune (PUNE)", "New Delhi (NDLS)", "Nagpur (NGP)"];

// Each train: route = stations in order with distance (kilometres) from the first station.
const trains = [
  { number: "12759", name: "Charminar Express", route: [["Hyderabad (HYD)", 0], ["Kazipet (KZJ)", 132], ["Vijayawada (BZA)", 350], ["Chennai (MAS)", 790]], days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], departs: "18:00" },
  { number: "12785", name: "Kacheguda Express",  route: [["Hyderabad (HYD)", 0], ["Bengaluru (SBC)", 610]], days: ["Monday", "Wednesday", "Friday", "Sunday"], departs: "19:05" },
  { number: "17032", name: "Mumbai Express",     route: [["Hyderabad (HYD)", 0], ["Pune (PUNE)", 560], ["Mumbai (CSMT)", 770]], days: ["Tuesday", "Thursday", "Saturday"], departs: "20:40" },
  { number: "12723", name: "Telangana Express",  route: [["Hyderabad (HYD)", 0], ["Kazipet (KZJ)", 132], ["Nagpur (NGP)", 580], ["New Delhi (NDLS)", 1670]], days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], departs: "06:25" },
  { number: "12604", name: "Chennai Express",    route: [["Chennai (MAS)", 0], ["Vijayawada (BZA)", 430], ["Hyderabad (HYD)", 790]], days: ["Monday", "Wednesday", "Saturday"], departs: "16:45" }
];

// Fare = distance x rate per kilometre + reservation charge (per passenger). Capacity kept small so waitlist can be shown.
const travelClasses = {
  SL: { name: "Sleeper",       ratePerKilometre: 0.6, reservation: 20, capacity: 8 },
  "3A": { name: "AC 3 Tier",   ratePerKilometre: 1.6, reservation: 40, capacity: 6 },
  "2A": { name: "AC 2 Tier",   ratePerKilometre: 2.3, reservation: 50, capacity: 4 },
  "1A": { name: "AC First",    ratePerKilometre: 3.8, reservation: 60, capacity: 2 }
};
const GST_PERCENT_AC = 5;  // 5% GST only on AC classes
const CANCELLATION_CHARGE = { SL: 60, "3A": 180, "2A": 200, "1A": 240 }; // per passenger
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let journey = { source: stations[0], destination: stations[2], date: null, train: null, travelClass: "SL", distance: 0 };
let seatsBooked = {};  // "trainNumber|date|travelClass" -> list of confirmed seat numbers taken
let tickets = {};      // pnr -> ticket

const seatKey = () => `${journey.train.number}|${journey.date}|${journey.travelClass}`;
const stationIndex = (train, station) => train.route.findIndex((routeStop) => routeStop[0] === station);

// ===================== 1. SEARCH TRAINS =====================
// A train matches if it stops at source BEFORE destination and runs on that weekday.
function searchTrains(source, destination, date) {
  clearSelectedTrain();
  journey.date = date;
  if (!date) {
    showMessage("searchMessage", "Choose a journey date.", true);
    return [];
  }
  if (date < getElement("journeyDate").min) {
    showMessage("searchMessage", "Journey date cannot be in the past.", true);
    logFunctionCall("searchTrains", `-> REJECTED, past date ${date}`);
    return [];
  }
  if (source === destination) {
    showMessage("searchMessage", "Source and destination cannot be the same.", true);
    logFunctionCall("searchTrains", "-> REJECTED, same stations");
    return [];
  }
  const dayName = DAY_NAMES[new Date(date + "T00:00").getDay()];
  const foundTrains = trains.filter((train) => {
    const sourceIndex = stationIndex(train, source), destinationIndex = stationIndex(train, destination);
    return sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex && train.days.includes(dayName);
  });
  if (foundTrains.length === 0) {
    getElement("trains").innerHTML = "";
    showMessage("searchMessage", `No trains from ${source} to ${destination} on ${dayName}.`, true);
  } else {
    showMessage("searchMessage", `${foundTrains.length} train(s) found for ${dayName}, ${date}.`);
    getElement("trains").innerHTML = "<table><tr><th>Train Number</th><th>Train</th><th>Departs</th><th>Distance</th><th></th></tr>" +
      foundTrains.map((train) => `<tr><td>${train.number}</td><td>${train.name}</td><td>${train.departs}</td><td>${distanceOf(train)} kilometres</td>
        <td><button onclick="selectTrain('${train.number}')">Select</button></td></tr>`).join("") + "</table>";
  }
  logFunctionCall("searchTrains", `${source} -> ${destination} on ${date} (${dayName}) -> ${foundTrains.length} train(s)`);
  return foundTrains;
}

// Distance between chosen source and destination on a given train.
const distanceOf = (train) => train.route[stationIndex(train, journey.destination)][1] - train.route[stationIndex(train, journey.source)][1];

function selectTrain(trainNumber) {
  journey.train = trains.find((train) => train.number === trainNumber);
  journey.distance = distanceOf(journey.train);
  getElement("trainText").textContent = `Train ${journey.train.number} ${journey.train.name} · ${journey.source} → ${journey.destination} · ${journey.distance} kilometres · ${journey.date}`;
  logFunctionCall("selectTrain", `-> ${trainNumber} ${journey.train.name}`);
}

// A new search or a new station means the old train choice no longer applies.
function clearSelectedTrain() {
  journey.train = null;
  getElement("trains").innerHTML = "";
  getElement("fare").innerHTML = "";
  getElement("trainText").textContent = 'No train selected. Click "Select" on a train above.';
}

// ===================== 2. SELECT SOURCE =====================
function selectSource(station) {
  journey.source = station;
  clearSelectedTrain();
  logFunctionCall("selectSource", `-> ${station}`);
}

// ===================== 3. SELECT DESTINATION =====================
function selectDestination(station) {
  journey.destination = station;
  clearSelectedTrain();
  logFunctionCall("selectDestination", `-> ${station}`);
}

// ===================== 4. CHECK AVAILABILITY =====================
// Returns number of seats left (negative never; 0 means waitlist).
function checkAvailability() {
  if (!journey.train) {
    showMessage("availabilityMessage", "Search and select a train first.", true);
    return null;
  }
  const capacity = travelClasses[journey.travelClass].capacity;
  const seatsLeft = capacity - (seatsBooked[seatKey()] || []).length;
  const text = seatsLeft > 0 ? `AVAILABLE ${seatsLeft}` : "WAITLIST (all seats booked)";
  showMessage("availabilityMessage", `${journey.train.name}, ${travelClasses[journey.travelClass].name}: ${text}`, seatsLeft <= 0);
  logFunctionCall("checkAvailability", `${journey.train.number} ${journey.travelClass} on ${journey.date} -> ${text}`);
  return Math.max(seatsLeft, 0);
}

// ===================== 5. SELECT CLASS =====================
function selectClass(code) {
  journey.travelClass = code;
  getElement("fare").innerHTML = "";
  logFunctionCall("selectClass", `-> ${code} (${travelClasses[code].name})`);
}

// ===================== 6. CALCULATE FARE =====================
function calculateFare(passengers) {
  passengers = parseInt(passengers, 10);
  if (!journey.train) {
    showMessage("availabilityMessage", "Search and select a train first.", true);
    return null;
  }
  if (!(passengers >= 1 && passengers <= 6)) {
    showMessage("availabilityMessage", "Passengers must be between 1 and 6.", true);
    return null;
  }
  const travelClassDetails = travelClasses[journey.travelClass];
  const farePerPassenger = Math.round(journey.distance * travelClassDetails.ratePerKilometre) + travelClassDetails.reservation;
  const baseFare = farePerPassenger * passengers;
  const gstAmount = journey.travelClass === "SL" ? 0 : (baseFare * GST_PERCENT_AC) / 100;
  const total = baseFare + gstAmount;
  getElement("fare").innerHTML = `<table>
    <tr><td>Fare per passenger (${journey.distance} kilometres x ₹${travelClassDetails.ratePerKilometre} + ₹${travelClassDetails.reservation} reservation)</td><td>${formatRupees(farePerPassenger)}</td></tr>
    <tr><td>Passengers</td><td>${passengers}</td></tr>
    <tr><td>GST ${journey.travelClass === "SL" ? "(not on Sleeper)" : GST_PERCENT_AC + "%"}</td><td>${formatRupees(gstAmount)}</td></tr>
    <tr><td class="total">Total Fare</td><td class="total">${formatRupees(total)}</td></tr></table>`;
  logFunctionCall("calculateFare", `${journey.distance} kilometres, ${journey.travelClass}, ${passengers} passengers -> ${formatRupees(total)}`);
  return total;
}

// Draw one name/age row per passenger.
function renderPassengerInputs() {
  const passengerCount = Math.min(Math.max(parseInt(getElement("passengerCount").value, 10) || 1, 1), 6);
  let html = "";
  for (let passengerNumber = 1; passengerNumber <= passengerCount; passengerNumber++) {
    html += `<div class="row"><div><label>Passenger ${passengerNumber} Name</label><input id="passengerName${passengerNumber}"></div>
             <div><label>Age</label><input id="passengerAge${passengerNumber}" type="number" min="1" max="120"></div></div>`;
  }
  getElement("passengerInputs").innerHTML = html;
}

// Read passenger rows into an array of { name, age }.
function readPassengers() {
  const passengerList = [];
  for (let passengerNumber = 1; getElement("passengerName" + passengerNumber); passengerNumber++) passengerList.push({ name: getElement("passengerName" + passengerNumber).value.trim(), age: Number(getElement("passengerAge" + passengerNumber).value) });
  return passengerList;
}

// ===================== 7. BOOK TICKET =====================
// Each passenger gets the lowest free seat number; when the class is full they go on the waitlist.
function bookTicket(passengers) {
  if (!journey.train) {
    showMessage("bookMessage", "Search and select a train first.", true);
    return null;
  }
  if (passengers.some((passenger) => passenger.name.length < 2 || !(passenger.age >= 1 && passenger.age <= 120))) {
    showMessage("bookMessage", "Enter a name and valid age for every passenger.", true);
    logFunctionCall("bookTicket", "-> REJECTED, missing passenger details");
    return null;
  }
  const fare = calculateFare(passengers.length);
  const key = seatKey();
  const capacity = travelClasses[journey.travelClass].capacity;
  let waitlistCount = 0;
  const passengersWithStatus = passengers.map((passenger) => {
    const takenSeats = seatsBooked[key] || (seatsBooked[key] = []);
    for (let seatNumber = 1; seatNumber <= capacity; seatNumber++) {
      if (!takenSeats.includes(seatNumber)) {
        takenSeats.push(seatNumber);
        return { ...passenger, seatNumber, status: `CONFIRMED ${journey.travelClass}-${seatNumber}` };
      }
    }
    waitlistCount++;
    return { ...passenger, status: `WAITLIST ${waitlistCount}` };
  });
  const pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  tickets[pnr] = { pnr, train: journey.train, from: journey.source, to: journey.destination, date: journey.date,
                   travelClass: journey.travelClass, fare, passengers: passengersWithStatus, cancelled: false, key };
  showMessage("bookMessage", `Ticket booked. PNR: ${pnr}`);
  getElement("ticket").innerHTML = ticketHTML(tickets[pnr]);
  getElement("pnr").value = pnr;
  logFunctionCall("bookTicket", `${passengers.length} passengers on ${journey.train.number} -> PNR ${pnr}`);
  return pnr;
}

function ticketHTML(ticket) {
  return `<div class="ticket"><h3>🚆 ${ticket.train.number} ${ticket.train.name}</h3>
    <p><b>PNR:</b> ${ticket.pnr} &nbsp; <b>Date:</b> ${ticket.date} &nbsp; <b>Class:</b> ${travelClasses[ticket.travelClass].name}</p>
    <p><b>From:</b> ${ticket.from} &nbsp; <b>To:</b> ${ticket.to} &nbsp; <b>Fare:</b> ${formatRupees(ticket.fare)}</p>
    <table><tr><th>Passenger</th><th>Age</th><th>Status</th></tr>
    ${ticket.passengers.map((passenger) => `<tr><td>${escapeHtml(passenger.name)}</td><td>${passenger.age}</td><td>${passenger.status}</td></tr>`).join("")}</table></div>`;
}

// ===================== 8. CANCEL TICKET =====================
function cancelTicket(pnr) {
  const ticket = tickets[pnr.trim()];
  if (!ticket) {
    showMessage("pnrMessage", "PNR not found.", true);
    logFunctionCall("cancelTicket", `${pnr} -> NOT FOUND`);
    return null;
  }
  if (ticket.cancelled) {
    showMessage("pnrMessage", "Ticket is already cancelled.", true);
    return null;
  }
  ticket.cancelled = true;
  // free the confirmed seats; the cancellation charge applies only to confirmed passengers
  const confirmedPassengers = ticket.passengers.filter((passenger) => passenger.status.startsWith("CONFIRMED"));
  const confirmedCount = confirmedPassengers.length;
  const freedSeats = confirmedPassengers.map((passenger) => passenger.seatNumber);
  seatsBooked[ticket.key] = seatsBooked[ticket.key].filter((seatNumber) => !freedSeats.includes(seatNumber));
  const charge = confirmedCount * CANCELLATION_CHARGE[ticket.travelClass];
  const refund = Math.max(ticket.fare - charge, 0);
  ticket.passengers.forEach((passenger) => (passenger.status = "CANCELLED"));
  showMessage("pnrMessage", `PNR ${ticket.pnr} cancelled. Cancellation charge ${formatRupees(charge)}, refund ${formatRupees(refund)}.`);
  getElement("pnrInformation").innerHTML = ticketHTML(ticket);
  logFunctionCall("cancelTicket", `${ticket.pnr} -> CANCELLED, refund ${formatRupees(refund)}`);
  return refund;
}

// ===================== 9. CHECK PNR STATUS =====================
function checkPNRStatus(pnr) {
  const ticket = tickets[pnr.trim()];
  if (!ticket) {
    showMessage("pnrMessage", "PNR not found.", true);
    getElement("pnrInformation").innerHTML = "";
    logFunctionCall("checkPNRStatus", `${pnr} -> NOT FOUND`);
    return null;
  }
  showMessage("pnrMessage", `PNR ${ticket.pnr}: ${ticket.cancelled ? "CANCELLED" : "BOOKED"}`, ticket.cancelled);
  getElement("pnrInformation").innerHTML = ticketHTML(ticket);
  logFunctionCall("checkPNRStatus", `${ticket.pnr} -> ${ticket.passengers.map((passenger) => passenger.status).join(", ")}`);
  return ticket;
}

// ===================== PAGE SETUP =====================
const stationOptions = stations.map((station) => `<option>${station}</option>`).join("");
getElement("source").innerHTML = stationOptions;
getElement("destination").innerHTML = stationOptions;
getElement("source").value = journey.source;
getElement("destination").value = journey.destination;
const today = new Date();
getElement("journeyDate").value = getElement("journeyDate").min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
renderPassengerInputs();
