// Shared helper functions used by all six projects.

// Get an element from the page by its id.
const getElement = (elementId) => document.getElementById(elementId);

// Format a number as Indian Rupees, for example 1500 -> "₹1,500.00".
const formatRupees = (amount) => "₹" + Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Write one line into the Activity Log panel so the user can see which function ran.
function logFunctionCall(functionName, detail) {
  const logLine = document.createElement("div");
  const currentTime = new Date().toLocaleTimeString();
  const functionNameLabel = document.createElement("span");
  functionNameLabel.className = "function-name";
  functionNameLabel.textContent = functionName + "()";
  // textContent (not innerHTML) so user-typed text can never inject HTML
  logLine.append(`[${currentTime}] `, functionNameLabel, " " + detail);
  const activityLog = getElement("activityLog");
  activityLog.appendChild(logLine);
  activityLog.scrollTop = activityLog.scrollHeight;
  console.log(`${functionName}() ${detail}`);
}

// Escape text before putting it inside innerHTML (stops HTML injection from user input).
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

// Show a success or error message inside a box with the given id.
function showMessage(messageBoxId, text, isError) {
  const messageBox = getElement(messageBoxId);
  messageBox.textContent = text;
  messageBox.className = "message " + (isError ? "error" : "success");
}
