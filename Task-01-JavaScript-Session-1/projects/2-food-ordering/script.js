// ===================== DATA =====================
const menu = [
  { id: 1, name: "Chicken Biryani", category: "Main Course", price: 250 },
  { id: 2, name: "Veg Biryani",     category: "Main Course", price: 180 },
  { id: 3, name: "Paneer Butter Masala", category: "Curry",  price: 220 },
  { id: 4, name: "Butter Naan",     category: "Breads",      price: 40 },
  { id: 5, name: "Masala Dosa",     category: "Tiffin",      price: 90 },
  { id: 6, name: "Gulab Jamun",     category: "Dessert",     price: 60 },
  { id: 7, name: "Cold Coffee",     category: "Beverages",   price: 110 }
];

// Coupons: percent = % off the subtotal, flat = fixed rupees off. minimumOrder = minimum subtotal.
const coupons = {
  FOOD10: { type: "percent", value: 10, minimumOrder: 0 },
  FLAT50: { type: "flat",    value: 50, minimumOrder: 300 }
};

const GST_RATE = 5;        // 5% GST on food
const DELIVERY_FEE = 30;   // flat delivery charge
const ORDER_STAGES = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];

let selectedItem = null;   // item chosen with selectFood()
let cart = [];             // [{ id, name, price, quantity }]
let appliedCoupon = null;  // coupon code string or null
let order = null;          // { id, amount, method, stage, cancelled }

// True while an order is placed and not yet cancelled or delivered (the cart is locked then).
const orderInProgress = () => order !== null && !order.cancelled && order.stage < ORDER_STAGES.length - 1;

// ===================== 1. DISPLAY MENU =====================
function displayMenu() {
  let rows = "";
  menu.forEach((item) => {
    rows += `<tr><td>${item.name}</td><td>${item.category}</td><td>${formatRupees(item.price)}</td>
             <td><button onclick="selectFood(${item.id})">Select</button></td></tr>`;
  });
  getElement("menu").innerHTML = `<table><tr><th>Item</th><th>Category</th><th>Price</th><th></th></tr>${rows}</table>`;
  logFunctionCall("displayMenu", `-> ${menu.length} items shown`);
}

// ===================== 2. SELECT FOOD =====================
function selectFood(id) {
  selectedItem = menu.find((item) => item.id === id);
  getElement("selectedText").textContent = `Selected: ${selectedItem.name} (${formatRupees(selectedItem.price)} each)`;
  getElement("quantity").value = 1;
  logFunctionCall("selectFood", `id=${id} -> ${selectedItem.name}`);
  return selectedItem;
}

// ===================== 3. ADD TO CART =====================
function addToCart(quantity) {
  const parsedQuantity = parseInt(quantity, 10);
  if (!selectedItem) {
    showMessage("cartMessage", "Select a food item first.", true);
    logFunctionCall("addToCart", "-> REJECTED, no item selected");
    return false;
  }
  if (!(parsedQuantity > 0)) {
    showMessage("cartMessage", "Quantity must be at least 1.", true);
    logFunctionCall("addToCart", `quantity=${quantity} -> REJECTED`);
    return false;
  }
  if (orderInProgress()) {
    showMessage("cartMessage", "Order already placed. Cancel it to change the cart.", true);
    return false;
  }
  // if the item is already in the cart, just increase its quantity
  const existing = cart.find((cartItem) => cartItem.id === selectedItem.id);
  if (existing) existing.quantity += parsedQuantity;
  else cart.push({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, quantity: parsedQuantity });

  showMessage("cartMessage", `${parsedQuantity} x ${selectedItem.name} added to cart.`);
  logFunctionCall("addToCart", `${selectedItem.name} x${parsedQuantity} -> cart has ${cart.length} item type(s)`);
  renderCart();
  return true;
}

// Draw the cart table with a Remove button on each row.
function renderCart() {
  if (cart.length === 0) {
    getElement("cart").innerHTML = "<p>Cart is empty.</p>";
    getElement("bill").innerHTML = "";
    return;
  }
  let rows = "";
  cart.forEach((cartItem) => {
    rows += `<tr><td>${cartItem.name}</td><td>${cartItem.quantity}</td><td>${formatRupees(cartItem.price * cartItem.quantity)}</td>
             <td><button class="danger" onclick="removeItem(${cartItem.id})">Remove</button></td></tr>`;
  });
  getElement("cart").innerHTML = `<table><tr><th>Item</th><th>Quantity</th><th>Amount</th><th></th></tr>${rows}</table>`;
  calculateBill();
}

// ===================== 4. REMOVE ITEM =====================
function removeItem(id) {
  if (orderInProgress()) {
    showMessage("cartMessage", "Order already placed. Cancel it to change the cart.", true);
    return false;
  }
  const item = cart.find((cartItem) => cartItem.id === id);
  cart = cart.filter((cartItem) => cartItem.id !== id);
  logFunctionCall("removeItem", `${item.name} removed -> ${cart.length} item type(s) left`);
  renderCart();
  return true;
}

// ===================== 5. CALCULATE BILL =====================
// Returns { subtotal, discount, gst, delivery, total }
function calculateBill() {
  const subtotal = cart.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
  let discount = 0;
  if (appliedCoupon) {
    const coupon = coupons[appliedCoupon];
    if (subtotal < coupon.minimumOrder) {
      appliedCoupon = null; // cart shrank below the coupon's minimum
      showMessage("couponMessage", "Coupon removed: order is below its minimum.", true);
    } else {
      discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
    }
  }
  const gst = ((subtotal - discount) * GST_RATE) / 100;
  const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
  const total = subtotal - discount + gst + delivery;

  getElement("bill").innerHTML = `<table>
      <tr><td>Subtotal</td><td>${formatRupees(subtotal)}</td></tr>
      <tr><td>Coupon discount ${appliedCoupon ? "(" + appliedCoupon + ")" : ""}</td><td>- ${formatRupees(discount)}</td></tr>
      <tr><td>GST ${GST_RATE}%</td><td>${formatRupees(gst)}</td></tr>
      <tr><td>Delivery fee</td><td>${formatRupees(delivery)}</td></tr>
      <tr><td class="total">Total</td><td class="total">${formatRupees(total)}</td></tr></table>`;
  logFunctionCall("calculateBill", `subtotal=${subtotal}, discount=${discount}, gst=${gst.toFixed(2)} -> total ${formatRupees(total)}`);
  return { subtotal, discount, gst, delivery, total };
}

// ===================== 6. APPLY COUPON =====================
function applyCoupon(code) {
  if (orderInProgress()) {
    showMessage("couponMessage", "Order already placed. Coupons cannot be changed now.", true);
    return false;
  }
  code = code.trim().toUpperCase();
  const coupon = coupons[code];
  const subtotal = cart.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
  if (!coupon) {
    showMessage("couponMessage", "Invalid coupon code.", true);
    logFunctionCall("applyCoupon", `code=${code} -> INVALID`);
    return false;
  }
  if (subtotal < coupon.minimumOrder) {
    showMessage("couponMessage", `${code} needs a minimum order of ${formatRupees(coupon.minimumOrder)}.`, true);
    logFunctionCall("applyCoupon", `code=${code} -> subtotal ${subtotal} below minimum`);
    return false;
  }
  appliedCoupon = code;
  showMessage("couponMessage", `Coupon ${code} applied!`);
  logFunctionCall("applyCoupon", `code=${code} -> APPLIED`);
  calculateBill();
  return true;
}

// ===================== 7. MAKE PAYMENT =====================
function makePayment(method) {
  if (cart.length === 0) {
    showMessage("paymentMessage", "Your cart is empty.", true);
    logFunctionCall("makePayment", "-> REJECTED, empty cart");
    return null;
  }
  if (orderInProgress()) {
    showMessage("paymentMessage", "Order " + order.id + " is already placed.", true);
    return null;
  }
  const bill = calculateBill();
  order = { id: "FD" + Date.now().toString().slice(-6), amount: bill.total, method: method, stage: 0, cancelled: false };
  const paymentText = method === "Cash on Delivery"
    ? `Order placed. Please pay ${formatRupees(bill.total)} on delivery.`
    : `Payment of ${formatRupees(bill.total)} via ${method} successful.`;
  showMessage("paymentMessage", `${paymentText} Order ID: ${order.id}`);
  logFunctionCall("makePayment", `method=${method}, amount=${bill.total.toFixed(2)} -> order ${order.id}`);
  renderSteps();
  return order;
}

// Draw the 4 delivery stages, highlighting completed ones.
function renderSteps() {
  getElement("steps").innerHTML = ORDER_STAGES.map((stageName, stageIndex) =>
    `<div class="step ${order && !order.cancelled && stageIndex <= order.stage ? "done" : ""}">${stageName}</div>`).join("");
}

// ===================== 8. TRACK ORDER =====================
// Each call moves the order one stage forward (simulates time passing).
function trackOrder() {
  if (!order) {
    showMessage("trackMessage", "No order placed yet.", true);
    return null;
  }
  if (order.cancelled) {
    showMessage("trackMessage", `Order ${order.id} was cancelled.`, true);
    logFunctionCall("trackOrder", `${order.id} -> CANCELLED`);
    return "Cancelled";
  }
  if (order.stage < ORDER_STAGES.length - 1) order.stage++;
  const status = ORDER_STAGES[order.stage];
  if (status === "Delivered" && cart.length > 0) {
    // delivered: empty the cart so the customer can start a new order
    cart = [];
    appliedCoupon = null;
    renderCart();
  }
  showMessage("trackMessage", `Order ${order.id}: ${status}`);
  logFunctionCall("trackOrder", `${order.id} -> ${status}`);
  renderSteps();
  return status;
}

// ===================== 9. CANCEL ORDER =====================
// Allowed only before the food is out for delivery.
function cancelOrder() {
  if (!order || order.cancelled) {
    showMessage("trackMessage", "There is no active order to cancel.", true);
    return false;
  }
  if (order.stage >= 2) {
    showMessage("trackMessage", "Cannot cancel: order is already " + ORDER_STAGES[order.stage] + ".", true);
    logFunctionCall("cancelOrder", `${order.id} -> NOT ALLOWED at stage "${ORDER_STAGES[order.stage]}"`);
    return false;
  }
  order.cancelled = true;
  showMessage("trackMessage", `Order ${order.id} cancelled. Refund of ${formatRupees(order.amount)} initiated.`);
  logFunctionCall("cancelOrder", `${order.id} -> CANCELLED, refund ${formatRupees(order.amount)}`);
  renderSteps();
  return true;
}

// Start: show the menu when the page loads.
displayMenu();
