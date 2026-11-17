// ===================== DATA =====================
// Customer list (from the class notes) with a PIN and a transactions list added.
let customers = [
  { accountNumber: 123, name: "Sai",   accountType: "Savings",  address: "Hyderabad",    pin: "1111", balance: 500,   transactions: [] },
  { accountNumber: 124, name: "Ravi",  accountType: "Current", address: "Secunderabad", pin: "2222", balance: 10000, transactions: [] },
  { accountNumber: 125, name: "Kiran", accountType: "Savings",  address: "Kukatpally",   pin: "3333", balance: 2500,  transactions: [] }
];

let currentCustomer = null; // the customer who is logged in (null = nobody)
const MINIMUM_BALANCE = 0;  // balance can never go below this

// Helper: find a customer by account number.
const findAccount = (accountNumber) => customers.find((customer) => customer.accountNumber === Number(accountNumber));

// Helper: record a transaction in a customer's history.
function addTransaction(customer, type, amount) {
  customer.transactions.push({
    date: new Date().toLocaleString(),
    type: type,
    amount: amount,
    balance: customer.balance
  });
}

// Helper: check that an amount is a positive number. Returns the number or null.
function validAmount(value) {
  const amount = Number(value);
  return amount > 0 ? amount : null;
}

// ===================== 1. ACCOUNT LOGIN =====================
// with parameters, with return value (true / false)
function accountLogin(accountNumber, pin) {
  const customer = findAccount(accountNumber);
  if (!customer || customer.pin !== String(pin)) {
    logFunctionCall("accountLogin", `accountNumber=${accountNumber} -> FAILED (wrong account or PIN)`);
    showMessage("loginMessage", "Invalid account number or PIN.", true);
    return false;
  }
  currentCustomer = customer;
  getElement("customerName").textContent = customer.name;
  getElement("customerType").textContent = customer.accountType + " · Account " + customer.accountNumber;
  getElement("loginCard").classList.add("hidden");
  getElement("bankArea").classList.remove("hidden");
  logFunctionCall("accountLogin", `accountNumber=${accountNumber} -> SUCCESS, welcome ${customer.name}`);
  return true;
}

// ===================== 2. BALANCE ENQUIRY =====================
// without parameters, with return value
function balanceEnquiry() {
  const balance = currentCustomer.balance;
  showMessage("balanceMessage", "Available balance: " + formatRupees(balance));
  logFunctionCall("balanceEnquiry", `-> ${formatRupees(balance)}`);
  return balance;
}

// ===================== 3. DEPOSIT =====================
function deposit(value) {
  const amount = validAmount(value);
  if (amount === null) {
    showMessage("depositMessage", "Enter an amount greater than 0.", true);
    logFunctionCall("deposit", `amount=${value} -> REJECTED`);
    return false;
  }
  currentCustomer.balance += amount;
  addTransaction(currentCustomer, "Deposit", amount);
  showMessage("depositMessage", `${formatRupees(amount)} deposited. New balance: ${formatRupees(currentCustomer.balance)}`);
  logFunctionCall("deposit", `amount=${amount} -> balance ${formatRupees(currentCustomer.balance)}`);
  return true;
}

// ===================== 4. WITHDRAW =====================
function withdraw(value) {
  const amount = validAmount(value);
  if (amount === null) {
    showMessage("withdrawMessage", "Enter an amount greater than 0.", true);
    logFunctionCall("withdraw", `amount=${value} -> REJECTED`);
    return false;
  }
  if (currentCustomer.balance - amount < MINIMUM_BALANCE) {
    showMessage("withdrawMessage", "Insufficient balance. Available: " + formatRupees(currentCustomer.balance), true);
    logFunctionCall("withdraw", `amount=${amount} -> INSUFFICIENT FUNDS`);
    return false;
  }
  currentCustomer.balance -= amount;
  addTransaction(currentCustomer, "Withdraw", amount);
  showMessage("withdrawMessage", `${formatRupees(amount)} withdrawn. New balance: ${formatRupees(currentCustomer.balance)}`);
  logFunctionCall("withdraw", `amount=${amount} -> balance ${formatRupees(currentCustomer.balance)}`);
  return true;
}

// ===================== 5. FUND TRANSFER =====================
function fundTransfer(toAccountNumber, value) {
  const amount = validAmount(value);
  const receiver = findAccount(toAccountNumber);
  let error = null;
  if (!receiver) error = "Receiver account not found.";
  else if (receiver === currentCustomer) error = "Cannot transfer to your own account.";
  else if (amount === null) error = "Enter an amount greater than 0.";
  else if (currentCustomer.balance - amount < MINIMUM_BALANCE) error = "Insufficient balance.";

  if (error) {
    showMessage("transferMessage", error, true);
    logFunctionCall("fundTransfer", `to=${toAccountNumber}, amount=${value} -> FAILED: ${error}`);
    return false;
  }
  currentCustomer.balance -= amount;
  receiver.balance += amount;
  addTransaction(currentCustomer, "Transfer to " + receiver.accountNumber, amount);
  addTransaction(receiver, "Transfer from " + currentCustomer.accountNumber, amount);
  showMessage("transferMessage", `${formatRupees(amount)} sent to ${receiver.name} (Account ${receiver.accountNumber}). Your balance: ${formatRupees(currentCustomer.balance)}`);
  logFunctionCall("fundTransfer", `to=${receiver.accountNumber}, amount=${amount} -> SUCCESS`);
  return true;
}

// ===================== 6. MINI STATEMENT =====================
function miniStatement() {
  const lastFive = currentCustomer.transactions.slice(-5).reverse();
  if (lastFive.length === 0) {
    getElement("statement").innerHTML = "<p>No transactions yet.</p>";
  } else {
    let rows = "";
    lastFive.forEach((transaction) => {
      rows += `<tr><td>${transaction.date}</td><td>${escapeHtml(transaction.type)}</td><td>${formatRupees(transaction.amount)}</td><td>${formatRupees(transaction.balance)}</td></tr>`;
    });
    getElement("statement").innerHTML = `<table><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance</th></tr>${rows}</table>`;
  }
  logFunctionCall("miniStatement", `-> showing ${lastFive.length} transaction(s)`);
  return lastFive;
}

// ===================== 7. LOGOUT =====================
function logout() {
  logFunctionCall("logout", `${currentCustomer.name} logged out, session closed`);
  currentCustomer = null;
  // clear every input so the next user sees nothing from this session
  document.querySelectorAll("input").forEach((input) => (input.value = ""));
  document.querySelectorAll(".message").forEach((messageBox) => (messageBox.className = "message"));
  getElement("statement").innerHTML = "";
  getElement("bankArea").classList.add("hidden");
  getElement("loginCard").classList.remove("hidden");
}
