# Builds one test page per app (the app's own HTML + a test script) and runs it in headless Chrome.
import os, re, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "projects").replace("\\", "/")
HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"

MONDAY = """const nextDay = (weekday) => { const day = new Date(); while (day.getDay() !== weekday) day.setDate(day.getDate() + 1);
  return day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0'); };"""

TESTS = {
"1-banking": """
check(accountLogin(123, '0000') === false);
check(accountLogin(123, '1111') === true);
check(balanceEnquiry() === 500);
check(deposit(1000) === true && currentCustomer.balance === 1500);
check(deposit(-5) === false);
check(withdraw(5000) === false);
check(withdraw(200) === true && currentCustomer.balance === 1300);
check(fundTransfer(124, 300) === true && currentCustomer.balance === 1000 && findAccount(124).balance === 10300);
check(fundTransfer(999, 10) === false && fundTransfer(123, 10) === false);
check(miniStatement().length === 3);
logout(); check(currentCustomer === null);
""",
"2-food-ordering": """
check(addToCart(1) === false);
selectFood(1); check(addToCart(2) === true);
selectFood(4); addToCart(3); selectFood(1); addToCart(1);
check(cart.length === 2 && cart[0].quantity === 3);
let bill = calculateBill(); check(bill.subtotal === 870);
check(applyCoupon('bad') === false);
check(applyCoupon('flat50') === true);
bill = calculateBill(); check(bill.discount === 50 && Math.abs(bill.total - 891) < 0.01);
removeItem(1); bill = calculateBill(); check(bill.subtotal === 120 && bill.discount === 0 && appliedCoupon === null);
check(!!makePayment('UPI'));
check(trackOrder() === 'Preparing');
check(cancelOrder() === true);
check(trackOrder() === 'Cancelled');
makePayment('UPI'); trackOrder(); trackOrder(); check(cancelOrder() === false);
check(applyCoupon('FOOD10') === false);
trackOrder(); check(cart.length === 0);
selectFood(2); check(addToCart(1) === true && !!makePayment('Cash on Delivery'));
check(getElement('paymentMessage').textContent.startsWith('Order placed. Please pay'));
""",
"3-movie-booking": """
check(checkSeatAvailability() === 0);
selectMovie(3); selectTheatre('AMB Cinemas'); selectShowTime('Evening');
const free = checkSeatAvailability(); check(free > 0 && free <= 50);
check(bookTickets() === false);
check(makePayment('UPI') === false);
const freeSeats = ['A', 'C', 'E'].map((row) => { for (let seatNumber = 1; seatNumber <= 10; seatNumber++) { const seat = row + seatNumber; if (!bookedSeats[showKey()].includes(seat)) return seat; } }).filter(Boolean);
freeSeats.forEach(toggleSeat);
check(bookTickets() === true);
const base = freeSeats.reduce((sum, seat) => sum + rowPrice[seat[0]], 0);
check(Math.abs(booking.amount - (base * 1.18 + 30 * freeSeats.length)) < 0.01);
check(makePayment('Wallet') === true);
check(selectedSeats.length === 0 && bookTickets() === false);
check(freeSeats.every((seat) => bookedSeats[showKey()].includes(seat)));
check(checkSeatAvailability() === free - freeSeats.length);
check(getElement('ticket').textContent.includes(booking.bookingId));
check(/day, \\d+ \\w+ \\d{4}/.test(getElement('date').options[0].value));
selectDate(getElement('date').options[2].value); check(getElement('seats').innerHTML === '');
""",
"4-ecommerce": """
check(userRegistration('Al', 'a@b.com', '123456') === false);
check(userRegistration('Ravi', 'bad', '123456') === false);
check(userRegistration('Ravi', 'ravi@test.com', '123') === false);
check(userRegistration('Ravi', 'ravi@test.com', 'secret1') === true);
check(userRegistration('Ravi', 'RAVI@test.com', 'secret1') === false);
check(userLogin('ravi@test.com', 'nope') === false);
check(userLogin('ravi@test.com', 'secret1') === true);
check(searchProduct('books').length === 1 && searchProduct('').length === 7);
addToCart(1); addToCart(5); addToCart(5);
check(calculatePrice() === 16899);
check(applyDiscount('xx') === 0);
check(applyDiscount('BIG500') === 500);
check(Math.abs(showSummary() - (16399 + 15999 * 0.18 * 16399 / 16899)) < 0.01);
removeFromCart(1); showSummary(); check(discountCode === null);
check(applyDiscount('save10') === 90);
const orderId = payment('UPI'); check(!!orderId && cart.length === 0 && orderTracking(orderId) === 'Ordered');
check(orderTracking('x') === null);
getElement('loginPassword').value = 'secret1'; logout(); check(getElement('loginPassword').value === '' && getElement('trackOrderId').value === '');
""",
"5-hospital": MONDAY + """
check(patientRegistration('Ravi Teja', '', 'Male', '9999999999') === null);
check(patientRegistration('Ravi Teja', '30', 'Male', '12345') === null);
check(patientRegistration('Ravi Teja', '25.5', 'Male', '9999999999') === null);
const patientId = patientRegistration('Ravi Teja', '30', 'Male', ' 9999999999 '); check(patientId === 'P1002');
check(doctorAvailability('Cardiologist', 'Tuesday').length === 0 && doctorAvailability('All', 'Saturday').length === 3);
const monday = nextDay(1), tuesday = nextDay(2);
check(appointmentBooking(patientId, 'D2', tuesday, '10:00 AM') === false);
check(appointmentBooking(patientId, 'D2', monday, '10:00 AM') === true);
check(appointmentBooking('P1001', 'D2', monday, '10:00 AM') === false);
check(appointmentBooking('P9999', 'D2', monday, '11:00 AM') === false);
check(appointmentBooking(patientId, 'D2', '2020-01-06', '10:00 AM') === false);
check(generatePrescription(patientId, 'D2', '', 'x') === null);
const prescription = generatePrescription(patientId, 'D2', 'Hypertension', 'Amlodipine 5mg - 1-0-0 - 30 days\\n\\nAspirin 75mg - 0-0-1 - 30 days'); check(prescription.medicines.length === 2);
check(patientHistory(patientId).length === 3);
const bill = generateBill(patientId, ['Electrocardiogram (ECG)', 'Blood Test'], 1); check(bill.total === 900 + 800 + 240 + 1500);
check(payment(bill.billNumber, 'UPI') === true && payment(bill.billNumber, 'UPI') === false);
check(patientHistory('p1001').length === 1);
""",
"6-railway": MONDAY + """
const monday = nextDay(1);
check(searchTrains('Hyderabad (HYD)', 'Hyderabad (HYD)', monday).length === 0);
selectSource('Hyderabad (HYD)'); selectDestination('Vijayawada (BZA)');
check(searchTrains(journey.source, journey.destination, monday).length === 1);
selectSource('Vijayawada (BZA)'); selectDestination('Hyderabad (HYD)');
check(searchTrains(journey.source, journey.destination, monday).map((train) => train.number).join() === '12604');
selectTrain('12604'); check(journey.distance === 360);
selectClass('1A');
check(checkAvailability() === 2);
check(Math.abs(calculateFare(2) - (Math.round(360 * 3.8) + 60) * 2 * 1.05) < 0.01);
const pnr = bookTicket([{ name: 'Sai', age: 30 }, { name: 'Ravi', age: 40 }, { name: 'Kiran', age: 25 }]);
check(!!pnr && tickets[pnr].passengers.map((passenger) => passenger.status).join() === 'CONFIRMED 1A-1,CONFIRMED 1A-2,WAITLIST 1');
check(checkAvailability() === 0);
check(bookTicket([{ name: '', age: 30 }]) === null);
const refund = cancelTicket(pnr); check(refund === tickets[pnr].fare - 480);
check(checkAvailability() === 2 && checkPNRStatus(pnr).cancelled && cancelTicket(pnr) === null);
check(checkPNRStatus('123') === null);
const first = bookTicket([{ name: 'Asha', age: 30 }]); const second = bookTicket([{ name: 'Bala', age: 30 }]);
cancelTicket(first); const third = bookTicket([{ name: 'Charan', age: 30 }]);
check(tickets[third].passengers[0].status === 'CONFIRMED 1A-1' && tickets[second].passengers[0].status === 'CONFIRMED 1A-2');
check(searchTrains(journey.source, journey.destination, '2020-01-06').length === 0 && journey.train === null);
""",
}

HARNESS = """<script>
const results = [];
const check = (condition) => results.push(condition === true);
try {
%s
} catch (error) { results.push('ERROR: ' + error.message); }
document.body.setAttribute('data-results', JSON.stringify(results));
</script></body>"""

failed = 0
for app, tests in TESTS.items():
    html = open(f"{ROOT}/{app}/index.html", encoding="utf8").read()
    html = html.replace('href="../', f'href="file:///{ROOT}/').replace('src="../', f'src="file:///{ROOT}/').replace('src="script.js"', f'src="file:///{ROOT}/{app}/script.js"')
    html = html.replace("</body>", HARNESS % tests)
    page = f"{HERE}/{app}.test.html"
    open(page, "w", encoding="utf8").write(html)
    dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--dump-dom", "file:///" + page.replace("\\", "/")],
                         capture_output=True, text=True, encoding="utf8", timeout=60).stdout
    match = re.search(r"data-results=\"([^\"]*)\"", dom)
    results = match.group(1).replace("&quot;", '"') if match else "NO RESULT"
    ok = match and "false" not in results and "ERROR" not in results
    failed += 0 if ok else 1
    print(("PASS " if ok else "FAIL ") + app, results)
sys.exit(1 if failed else 0)
