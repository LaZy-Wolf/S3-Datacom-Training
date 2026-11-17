// ===================== DATA =====================
const doctors = [
  { id: "D1", name: "Doctor Meena Rao",    specialization: "General Physician", fee: 400, days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
  { id: "D2", name: "Doctor Arjun Reddy",  specialization: "Cardiologist",      fee: 900, days: ["Monday", "Wednesday", "Friday"] },
  { id: "D3", name: "Doctor Fatima Khan",  specialization: "Dermatologist",     fee: 600, days: ["Tuesday", "Thursday", "Saturday"] },
  { id: "D4", name: "Doctor Suresh Babu",  specialization: "Orthopedist",       fee: 700, days: ["Monday", "Tuesday", "Thursday"] },
  { id: "D5", name: "Doctor Lakshmi Iyer", specialization: "Pediatrician",      fee: 500, days: ["Wednesday", "Friday", "Saturday"] }
];
const testPrices = { "Blood Test": 350, "X-Ray": 600, "Electrocardiogram (ECG)": 450, "Magnetic Resonance Imaging (MRI) Scan": 4500, "Urine Test": 200 };
const ROOM_CHARGE_PER_DAY = 1500;
const MEDICINE_CHARGE_PER_ITEM = 120; // flat estimate per medicine line
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Patients with one demo patient that already has a past record.
let patients = {
  P1001: { id: "P1001", name: "Anil Kumar", age: 45, gender: "Male", phone: "9876543210",
           history: [{ date: "2026-08-12", type: "Visit", detail: "Doctor Meena Rao - Seasonal flu, rest advised" }],
           prescriptions: [] }
};
let nextPatientNumber = 1002;
let appointments = [];   // { patientId, doctorId, date, slot }
let bills = {};          // billNumber -> bill
let currentBill = null;

const findDoctor = (id) => doctors.find((doctor) => doctor.id === id);
const findPatient = (id) => patients[String(id).trim().toUpperCase()];

// ===================== 1. PATIENT REGISTRATION =====================
function patientRegistration(name, age, gender, phone) {
  name = name.trim();
  phone = String(phone).trim();
  const ageText = String(age).trim();
  age = Number(ageText);
  let error = null;
  if (name.length < 3) error = "Enter the patient's full name.";
  else if (ageText === "" || !Number.isInteger(age) || age < 0 || age > 120) error = "Enter a valid age in whole years (0-120).";
  else if (!/^\d{10}$/.test(phone)) error = "Phone must be exactly 10 digits.";
  if (error) {
    showMessage("registrationMessage", error, true);
    logFunctionCall("patientRegistration", `-> FAILED: ${error}`);
    return null;
  }
  const id = "P" + nextPatientNumber++;
  patients[id] = { id, name, age, gender, phone, history: [{ date: today(), type: "Registered", detail: "New patient registration" }], prescriptions: [] };
  showMessage("registrationMessage", `Patient registered. Patient ID: ${id}`);
  logFunctionCall("patientRegistration", `${name}, ${age}, ${gender} -> ID ${id}`);
  return id;
}

// Today's date as "YYYY-MM-DD" in local time.
const today = () => {
  const currentDate = new Date();
  return currentDate.getFullYear() + "-" + String(currentDate.getMonth() + 1).padStart(2, "0") + "-" + String(currentDate.getDate()).padStart(2, "0");
};

// ===================== 2. DOCTOR AVAILABILITY =====================
function doctorAvailability(specialization, day) {
  const list = doctors.filter((doctor) =>
    (specialization === "All" || doctor.specialization === specialization) &&
    (day === "Any" || doctor.days.includes(day)));
  if (list.length === 0) {
    getElement("doctors").innerHTML = "<p>No doctor available for this choice.</p>";
  } else {
    getElement("doctors").innerHTML = "<table><tr><th>Doctor</th><th>Specialization</th><th>Available Days</th><th>Fee</th></tr>" +
      list.map((doctor) => `<tr><td>${doctor.name}</td><td>${doctor.specialization}</td><td>${doctor.days.join(", ")}</td><td>${formatRupees(doctor.fee)}</td></tr>`).join("") +
      "</table>";
  }
  logFunctionCall("doctorAvailability", `${specialization}, ${day} -> ${list.length} doctor(s)`);
  return list;
}

// ===================== 3. APPOINTMENT BOOKING =====================
function appointmentBooking(patientId, doctorId, date, slot) {
  const patient = findPatient(patientId);
  const doctor = findDoctor(doctorId);
  let error = null;
  if (!patient) error = "Patient ID not found. Register first.";
  else if (!date) error = "Choose a date.";
  else if (date < today()) error = "Date cannot be in the past.";
  else {
    const dayName = DAY_NAMES[new Date(date + "T00:00").getDay()];
    if (!doctor.days.includes(dayName)) error = `${doctor.name} is not available on ${dayName}.`;
    else if (appointments.some((appointment) => appointment.doctorId === doctorId && appointment.date === date && appointment.slot === slot))
      error = "This slot is already booked. Pick another time.";
  }
  if (error) {
    showMessage("appointmentMessage", error, true);
    logFunctionCall("appointmentBooking", `${patientId}, ${doctorId}, ${date} ${slot} -> FAILED: ${error}`);
    return false;
  }
  appointments.push({ patientId: patient.id, doctorId, date, slot });
  patient.history.push({ date, type: "Appointment", detail: `${doctor.name} at ${slot}` });
  showMessage("appointmentMessage", `Appointment confirmed: ${patient.name} with ${doctor.name} on ${date} at ${slot}.`);
  logFunctionCall("appointmentBooking", `${patient.id} with ${doctor.name} on ${date} ${slot} -> CONFIRMED`);
  return true;
}

// ===================== 4. PATIENT HISTORY =====================
function patientHistory(patientId) {
  const patient = findPatient(patientId);
  if (!patient) {
    getElement("history").innerHTML = "<p>Patient not found.</p>";
    logFunctionCall("patientHistory", `${patientId} -> NOT FOUND`);
    return null;
  }
  getElement("history").innerHTML = `<p><b>${escapeHtml(patient.name)}</b>, ${patient.age} years, ${patient.gender}, ☎ ${patient.phone}</p>
    <table><tr><th>Date</th><th>Type</th><th>Details</th></tr>` +
    patient.history.map((historyEntry) => `<tr><td>${historyEntry.date}</td><td>${historyEntry.type}</td><td>${escapeHtml(historyEntry.detail)}</td></tr>`).join("") + "</table>";
  logFunctionCall("patientHistory", `${patient.id} -> ${patient.history.length} record(s)`);
  return patient.history;
}

// ===================== 5. GENERATE PRESCRIPTION =====================
function generatePrescription(patientId, doctorId, diagnosis, medicinesText) {
  const patient = findPatient(patientId);
  const doctor = findDoctor(doctorId);
  const medicines = medicinesText.split("\n").map((medicineLine) => medicineLine.trim()).filter((medicineLine) => medicineLine !== "");
  let error = null;
  if (!patient) error = "Patient ID not found.";
  else if (diagnosis.trim() === "") error = "Enter a diagnosis.";
  else if (medicines.length === 0) error = "Enter at least one medicine.";
  if (error) {
    showMessage("prescriptionMessage", error, true);
    logFunctionCall("generatePrescription", `-> FAILED: ${error}`);
    return null;
  }
  const prescription = { date: today(), doctor: doctor.name, diagnosis: diagnosis.trim(), medicines };
  patient.prescriptions.push(prescription);
  patient.history.push({ date: prescription.date, type: "Prescription", detail: `${doctor.name} - ${prescription.diagnosis}` });
  getElement("prescription").innerHTML = `<div class="ticket"><h3>℞ Prescription</h3>
    <p><b>Patient:</b> ${escapeHtml(patient.name)} (${patient.id}) &nbsp; <b>Date:</b> ${prescription.date}</p>
    <p><b>Doctor:</b> ${doctor.name}, ${doctor.specialization}</p>
    <p><b>Diagnosis:</b> ${escapeHtml(prescription.diagnosis)}</p>
    <ol>${medicines.map((medicine) => `<li>${escapeHtml(medicine)}</li>`).join("")}</ol></div>`;
  showMessage("prescriptionMessage", "Prescription generated and saved to patient history.");
  logFunctionCall("generatePrescription", `${patient.id} by ${doctor.name} -> ${medicines.length} medicine(s)`);
  return prescription;
}

// Which test checkboxes are ticked.
const checkedTests = () => [...document.querySelectorAll("#tests input:checked")].map((checkbox) => checkbox.value);

// ===================== 6. GENERATE BILL =====================
// consultation (last prescribing doctor's fee, or General Physician) + tests + medicines + room
function generateBill(patientId, tests, days) {
  const patient = findPatient(patientId);
  days = Number(days) || 0;
  if (!patient) {
    showMessage("billMessage", "Patient ID not found.", true);
    logFunctionCall("generateBill", `${patientId} -> NOT FOUND`);
    return null;
  }
  if (days < 0) {
    showMessage("billMessage", "Room days cannot be negative.", true);
    return null;
  }
  const lastPrescription = patient.prescriptions[patient.prescriptions.length - 1];
  const doctor = lastPrescription ? doctors.find((doctor) => doctor.name === lastPrescription.doctor) : doctors[0];
  const consultation = doctor.fee;
  const testTotal = tests.reduce((sum, testName) => sum + testPrices[testName], 0);
  const medicineTotal = lastPrescription ? lastPrescription.medicines.length * MEDICINE_CHARGE_PER_ITEM : 0;
  const room = days * ROOM_CHARGE_PER_DAY;
  const total = consultation + testTotal + medicineTotal + room;

  currentBill = { billNumber: "B" + Date.now().toString().slice(-6), patientId: patient.id, total, paid: false };
  bills[currentBill.billNumber] = currentBill;
  getElement("bill").innerHTML = `<table>
    <tr><td>Consultation (${doctor.name})</td><td>${formatRupees(consultation)}</td></tr>
    <tr><td>Tests: ${tests.length ? tests.join(", ") : "none"}</td><td>${formatRupees(testTotal)}</td></tr>
    <tr><td>Medicines (${lastPrescription ? lastPrescription.medicines.length : 0} x ${formatRupees(MEDICINE_CHARGE_PER_ITEM)})</td><td>${formatRupees(medicineTotal)}</td></tr>
    <tr><td>Room (${days} day(s) x ${formatRupees(ROOM_CHARGE_PER_DAY)})</td><td>${formatRupees(room)}</td></tr>
    <tr><td class="total">Total (Bill ${currentBill.billNumber})</td><td class="total">${formatRupees(total)}</td></tr></table>`;
  showMessage("billMessage", `Bill ${currentBill.billNumber} generated for ${patient.name}.`);
  logFunctionCall("generateBill", `${patient.id} -> ${currentBill.billNumber}, total ${formatRupees(total)}`);
  return currentBill;
}

// ===================== 7. PAYMENT =====================
function payment(billNumber, method) {
  const bill = bills[billNumber];
  if (!bill) {
    showMessage("paymentMessage", "Generate a bill first.", true);
    logFunctionCall("payment", "-> REJECTED, no bill");
    return false;
  }
  if (bill.paid) {
    showMessage("paymentMessage", `Bill ${billNumber} is already paid.`, true);
    return false;
  }
  bill.paid = true;
  patients[bill.patientId].history.push({ date: today(), type: "Payment", detail: `${billNumber} - ${formatRupees(bill.total)} via ${method}` });
  showMessage("paymentMessage", `Payment of ${formatRupees(bill.total)} received via ${method}. Receipt for bill ${billNumber}.`);
  logFunctionCall("payment", `${billNumber}, ${method} -> PAID ${formatRupees(bill.total)}`);
  return true;
}

// ===================== PAGE SETUP =====================
const specializations = ["All", ...new Set(doctors.map((doctor) => doctor.specialization))];
getElement("specialization").innerHTML = specializations.map((specialization) => `<option>${specialization}</option>`).join("");
const doctorOptions = doctors.map((doctor) => `<option value="${doctor.id}">${doctor.name} (${doctor.specialization})</option>`).join("");
getElement("appointmentDoctor").innerHTML = doctorOptions;
getElement("prescriptionDoctor").innerHTML = doctorOptions;
getElement("tests").innerHTML = Object.keys(testPrices)
  .map((testName) => `<label style="display:inline-block;margin-right:12px"><input type="checkbox" value="${testName}" style="width:auto"> ${testName} (${formatRupees(testPrices[testName])})</label>`).join("");
getElement("appointmentDate").min = today();
