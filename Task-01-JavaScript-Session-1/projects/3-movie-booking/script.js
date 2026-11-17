// ===================== DATA =====================
const movies = [
  { id: 1, title: "Skyline Heist",   language: "Telugu", genre: "Action",   duration: "2 hours 35 minutes", rating: "U/A" },
  { id: 2, title: "Monsoon Letters", language: "Hindi",  genre: "Romance",  duration: "2 hours 10 minutes", rating: "U" },
  { id: 3, title: "Orbit 9",         language: "English",genre: "Science Fiction",   duration: "2 hours 20 minutes", rating: "U/A" },
  { id: 4, title: "Laugh Riot",      language: "Tamil",  genre: "Comedy",   duration: "1 hour 55 minutes", rating: "U" }
];
const theatres = ["PVR Inorbit Mall", "INOX GVK One", "AMB Cinemas", "Prasads Multiplex"];
const showTimes = { Morning: "10:30 AM", Afternoon: "02:15 PM", Evening: "06:45 PM" };
const ROWS = ["A", "B", "C", "D", "E"];
const SEATS_PER_ROW = 10;
const rowPrice = { A: 150, B: 150, C: 200, D: 200, E: 300 };
const GST_RATE = 18;          // GST on movie tickets
const CONVENIENCE_FEE = 30;   // per ticket

// Seats already booked, stored per show. Key = "movieId|theatre|date|time".
const bookedSeats = {};

// What the customer has chosen so far.
let booking = { movie: null, theatre: null, date: null, showTime: null, seats: [], confirmed: false, paid: false };
let selectedSeats = [];

// Unique key for the chosen show.
const showKey = () => [booking.movie.id, booking.theatre, booking.date, booking.showTime].join("|");

// ===================== 1. DISPLAY MOVIES =====================
function displayMovies() {
  let rows = "";
  movies.forEach((movie) => {
    rows += `<tr><td><b>${movie.title}</b></td><td>${movie.language}</td><td>${movie.genre}</td><td>${movie.duration}</td><td>${movie.rating}</td>
             <td><button onclick="selectMovie(${movie.id})">Select</button></td></tr>`;
  });
  getElement("movies").innerHTML = `<table><tr><th>Movie</th><th>Language</th><th>Genre</th><th>Duration</th><th>Rating</th><th></th></tr>${rows}</table>`;
  logFunctionCall("displayMovies", `-> ${movies.length} movies showing`);
}

// ===================== 2. SELECT MOVIE =====================
function selectMovie(id) {
  booking = { movie: movies.find((movie) => movie.id === id), theatre: null, date: null, showTime: null, seats: [], confirmed: false, paid: false };
  selectedSeats = [];
  getElement("movieText").textContent = `Movie: ${booking.movie.title} (${booking.movie.language})`;
  getElement("seats").innerHTML = "";
  getElement("ticket").innerHTML = "<p>Ticket appears here after payment.</p>";
  getElement("price").innerHTML = "";
  fillShowOptions();
  logFunctionCall("selectMovie", `id=${id} -> ${booking.movie.title}`);
  return booking.movie;
}

// Fill the theatre / date / time drop-downs (first option chosen by default).
function fillShowOptions() {
  getElement("theatre").innerHTML = theatres.map((theatre) => `<option>${theatre}</option>`).join("");
  const dates = [];
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {               // next 5 days
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    dates.push(day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })); // for example "Monday, 16 November 2026"
  }
  getElement("date").innerHTML = dates.map((date) => `<option>${date}</option>`).join("");
  getElement("showTime").innerHTML = Object.keys(showTimes).map((slot) => `<option value="${slot}">${slot} (${showTimes[slot]})</option>`).join("");
  selectTheatre(theatres[0]);
  selectDate(dates[0]);
  selectShowTime("Morning");
}

// Changing theatre/date/time means a different show, so clear the seat map.
function resetSeats() {
  selectedSeats = [];
  booking.seats = [];
  booking.confirmed = false;
  booking.paid = false;
  getElement("seats").innerHTML = "";
  getElement("seatInformation").textContent = "Click 'Check Seat Availability' to load seats.";
  getElement("price").innerHTML = "";
  getElement("bookingMessage").className = "message"; // hide the old "seats confirmed" message
}

// ===================== 3. SELECT THEATRE =====================
function selectTheatre(name) {
  booking.theatre = name;
  resetSeats();
  logFunctionCall("selectTheatre", `-> ${name}`);
}

// ===================== 4. SELECT DATE =====================
function selectDate(date) {
  booking.date = date;
  resetSeats();
  logFunctionCall("selectDate", `-> ${date}`);
}

// ===================== 5. SELECT SHOW TIME =====================
function selectShowTime(slot) {
  booking.showTime = slot;
  resetSeats();
  logFunctionCall("selectShowTime", `-> ${slot} (${showTimes[slot]})`);
}

// ===================== 6. CHECK SEAT AVAILABILITY =====================
function checkSeatAvailability() {
  if (!booking.movie) {
    showMessage("showDetailsMessage", "Select a movie first.", true);
    return 0;
  }
  const key = showKey();
  // first time a show is opened, pretend some seats were already sold
  if (!bookedSeats[key]) {
    bookedSeats[key] = [];
    ROWS.forEach((rowLetter) => {
      for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber++) if (Math.random() < 0.25) bookedSeats[key].push(rowLetter + seatNumber);
    });
  }
  selectedSeats = [];
  booking.confirmed = false;
  booking.paid = false; // allows a fresh booking for the same show
  let html = "";
  ROWS.forEach((rowLetter) => {
    for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber++) {
      const seat = rowLetter + seatNumber;
      const taken = bookedSeats[key].includes(seat);
      html += `<div class="seat ${taken ? "booked" : ""}" id="seat-${seat}" onclick="toggleSeat('${seat}')">${seat}</div>`;
    }
  });
  getElement("seats").innerHTML = html;
  const available = ROWS.length * SEATS_PER_ROW - bookedSeats[key].length;
  getElement("seatInformation").textContent = `${available} of ${ROWS.length * SEATS_PER_ROW} seats available. Click seats to select.`;
  showMessage("showDetailsMessage", `${booking.theatre} · ${booking.date} · ${booking.showTime} (${showTimes[booking.showTime]})`);
  logFunctionCall("checkSeatAvailability", `${booking.theatre}, ${booking.date}, ${booking.showTime} -> ${available} seats free`);
  return available;
}

// Select / un-select one seat (helper used by the seat buttons).
function toggleSeat(seat) {
  if (bookedSeats[showKey()].includes(seat) || booking.paid) return;
  const seatElement = getElement("seat-" + seat);
  if (selectedSeats.includes(seat)) {
    selectedSeats = selectedSeats.filter((selectedSeat) => selectedSeat !== seat);
    seatElement.classList.remove("selected");
  } else {
    if (selectedSeats.length >= 10) return showMessage("bookingMessage", "Maximum 10 seats per booking.", true);
    selectedSeats.push(seat);
    seatElement.classList.add("selected");
  }
  booking.confirmed = false;
}

// ===================== 7. BOOK TICKETS =====================
function bookTickets() {
  if (selectedSeats.length === 0) {
    showMessage("bookingMessage", "Select at least one seat.", true);
    logFunctionCall("bookTickets", "-> REJECTED, no seats selected");
    return false;
  }
  // numeric sort so A2 comes before A10
  booking.seats = [...selectedSeats].sort((firstSeat, secondSeat) => firstSeat.localeCompare(secondSeat, undefined, { numeric: true }));
  booking.confirmed = true;
  showMessage("bookingMessage", `Seats ${booking.seats.join(", ")} confirmed. Proceed to payment.`);
  logFunctionCall("bookTickets", `seats=${booking.seats.join(",")}`);
  calculateTicketPrice();
  return true;
}

// ===================== 8. CALCULATE TICKET PRICE =====================
function calculateTicketPrice() {
  const base = booking.seats.reduce((sum, seat) => sum + rowPrice[seat[0]], 0);
  const fee = booking.seats.length * CONVENIENCE_FEE;
  const gst = (base * GST_RATE) / 100;
  const total = base + fee + gst;
  booking.amount = total;
  getElement("price").innerHTML = `<table>
    <tr><td>Tickets (${booking.seats.length})</td><td>${formatRupees(base)}</td></tr>
    <tr><td>Convenience fee (${formatRupees(CONVENIENCE_FEE)} x ${booking.seats.length})</td><td>${formatRupees(fee)}</td></tr>
    <tr><td>GST ${GST_RATE}%</td><td>${formatRupees(gst)}</td></tr>
    <tr><td class="total">Total</td><td class="total">${formatRupees(total)}</td></tr></table>`;
  logFunctionCall("calculateTicketPrice", `base=${base}, fee=${fee}, gst=${gst} -> ${formatRupees(total)}`);
  return total;
}

// ===================== 9. MAKE PAYMENT =====================
function makePayment(method) {
  if (!booking.confirmed) {
    showMessage("paymentMessage", "Book your seats first.", true);
    logFunctionCall("makePayment", "-> REJECTED, seats not booked");
    return false;
  }
  if (booking.paid) {
    showMessage("paymentMessage", "Already paid.", true);
    return false;
  }
  // mark the seats as sold for this show
  bookedSeats[showKey()].push(...booking.seats);
  booking.paid = true;
  booking.method = method;
  booking.bookingId = "MV" + Date.now().toString().slice(-7);
  selectedSeats = []; // these seats are sold now
  showMessage("paymentMessage", `Payment of ${formatRupees(booking.amount)} via ${method} successful.`);
  logFunctionCall("makePayment", `method=${method}, amount=${booking.amount} -> PAID`);
  generateTicket();
  return true;
}

// ===================== 10. GENERATE TICKET =====================
function generateTicket() {
  booking.seats.forEach((seat) => getElement("seat-" + seat).classList.replace("selected", "booked"));
  getElement("ticket").innerHTML = `<div class="ticket">
    <h3>🎬 ${booking.movie.title} (${booking.movie.rating})</h3>
    <p><b>Booking ID:</b> ${booking.bookingId}</p>
    <p><b>Theatre:</b> ${booking.theatre}</p>
    <p><b>Date &amp; Time:</b> ${booking.date}, ${booking.showTime} (${showTimes[booking.showTime]})</p>
    <p><b>Seats:</b> ${booking.seats.join(", ")}</p>
    <p><b>Amount Paid:</b> ${formatRupees(booking.amount)} via ${booking.method}</p>
    <p>Please arrive 15 minutes early. Enjoy the show!</p></div>`;
  logFunctionCall("generateTicket", `-> ${booking.bookingId} generated`);
  return booking;
}

displayMovies();
