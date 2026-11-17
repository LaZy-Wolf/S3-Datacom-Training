// ===================== DATA =====================
// shortcut: passwords kept in plain text in memory; a real site hashes them on a server.
let users = [{ name: "Demo User", email: "demo@shop.com", password: "demo123" }];

const products = [
  { id: 1, name: "Smartphone X10",      category: "Electronics", price: 15999 },
  { id: 2, name: "Wireless Earbuds",    category: "Electronics", price: 2499 },
  { id: 3, name: "Running Shoes",       category: "Footwear",    price: 3299 },
  { id: 4, name: "Cotton T-Shirt",      category: "Clothing",    price: 599 },
  { id: 5, name: "JavaScript Guide",    category: "Books",       price: 450 },
  { id: 6, name: "Basmati Rice 5 Kilograms",category: "Grocery",     price: 699 },
  { id: 7, name: "Steel Water Bottle",  category: "Home",        price: 349 }
];

// GST rate (%) for each product category.
const gstRates = { Electronics: 18, Footwear: 12, Clothing: 5, Books: 0, Grocery: 5, Home: 12 };

// Promotion codes: percent off, or flat off with a minimum order value.
const promotionCodes = {
  SAVE10: { type: "percent", value: 10, minimumOrder: 0 },
  BIG500: { type: "flat", value: 500, minimumOrder: 5000 }
};

const TRACK_STAGES = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

let loggedInUser = null;
let cart = [];            // [{ id, name, category, price, quantity }]
let discountCode = null;
let orders = {};          // orderId -> { amount, method, placedAt }

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ===================== 1. USER REGISTRATION =====================
function userRegistration(name, email, password) {
  name = name.trim();
  email = email.trim().toLowerCase();
  let error = null;
  if (name.length < 3) error = "Name must have at least 3 characters.";
  else if (!validEmail(email)) error = "Enter a valid email address.";
  else if (password.length < 6) error = "Password must be at least 6 characters.";
  else if (users.some((existingUser) => existingUser.email === email)) error = "This email is already registered.";

  if (error) {
    showMessage("registerMessage", error, true);
    logFunctionCall("userRegistration", `email=${email} -> FAILED: ${error}`);
    return false;
  }
  users.push({ name, email, password });
  showMessage("registerMessage", `Account created for ${name}. You can login now.`);
  logFunctionCall("userRegistration", `email=${email} -> SUCCESS (${users.length} users)`);
  return true;
}

// ===================== 2. USER LOGIN =====================
function userLogin(email, password) {
  email = email.trim().toLowerCase();
  const user = users.find((existingUser) => existingUser.email === email && existingUser.password === password);
  if (!user) {
    showMessage("loginMessage", "Invalid email or password.", true);
    logFunctionCall("userLogin", `email=${email} -> FAILED`);
    return false;
  }
  loggedInUser = user;
  getElement("userName").textContent = user.name;
  getElement("authArea").classList.add("hidden");
  getElement("shopArea").classList.remove("hidden");
  logFunctionCall("userLogin", `email=${email} -> SUCCESS`);
  displayProducts(products);
  return true;
}

function logout() {
  logFunctionCall("logout", `${loggedInUser.name} logged out`);
  loggedInUser = null;
  cart = [];
  discountCode = null;
  renderCart();
  // clear everything this user typed or saw, so the next person starts fresh
  document.querySelectorAll("input").forEach((input) => (input.value = ""));
  document.querySelectorAll(".message").forEach((messageBox) => (messageBox.className = "message"));
  getElement("steps").innerHTML = "";
  getElement("shopArea").classList.add("hidden");
  getElement("authArea").classList.remove("hidden");
}

// ===================== 3. DISPLAY PRODUCTS =====================
function displayProducts(list) {
  if (list.length === 0) {
    getElement("products").innerHTML = "<p>No products found.</p>";
  } else {
    let rows = "";
    list.forEach((product) => {
      rows += `<tr><td>${product.name}</td><td>${product.category}</td><td>${formatRupees(product.price)}</td>
               <td><button onclick="addToCart(${product.id})">Add to Cart</button></td></tr>`;
    });
    getElement("products").innerHTML = `<table><tr><th>Product</th><th>Category</th><th>Price</th><th></th></tr>${rows}</table>`;
  }
  logFunctionCall("displayProducts", `-> ${list.length} product(s) shown`);
}

// ===================== 4. SEARCH PRODUCT =====================
function searchProduct(text) {
  const searchQuery = text.trim().toLowerCase();
  const result = products.filter((product) => product.name.toLowerCase().includes(searchQuery) || product.category.toLowerCase().includes(searchQuery));
  logFunctionCall("searchProduct", `"${text}" -> ${result.length} match(es)`);
  displayProducts(result);
  return result;
}

// ===================== 5. ADD TO CART =====================
function addToCart(productId) {
  const product = products.find((availableProduct) => availableProduct.id === productId);
  const existingCartItem = cart.find((cartItem) => cartItem.id === productId);
  if (existingCartItem) existingCartItem.quantity++;
  else cart.push({ ...product, quantity: 1 });
  logFunctionCall("addToCart", `${product.name} -> cart now ${cart.reduce((itemCount, cartItem) => itemCount + cartItem.quantity, 0)} item(s)`);
  renderCart();
  return cart;
}

function removeFromCart(productId) {
  cart = cart.filter((cartItem) => cartItem.id !== productId);
  logFunctionCall("removeFromCart", `id=${productId} removed`);
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    getElement("cart").innerHTML = "<p>Cart is empty.</p>";
    getElement("summary").innerHTML = "";
    return;
  }
  let rows = "";
  cart.forEach((cartItem) => {
    rows += `<tr><td>${cartItem.name}</td><td>${cartItem.quantity}</td><td>${formatRupees(cartItem.price * cartItem.quantity)}</td>
             <td><button class="danger" onclick="removeFromCart(${cartItem.id})">Remove</button></td></tr>`;
  });
  getElement("cart").innerHTML = `<table><tr><th>Product</th><th>Quantity</th><th>Amount</th><th></th></tr>${rows}</table>`;
  showSummary();
}

// ===================== 6. CALCULATE PRICE =====================
// Total before discount and tax.
const calculateSubtotal = () => cart.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);

function calculatePrice() {
  const subtotal = calculateSubtotal();
  logFunctionCall("calculatePrice", `-> subtotal ${formatRupees(subtotal)}`);
  return subtotal;
}

// ===================== 7. APPLY DISCOUNT =====================
// Validates a promotion code and stores it. Returns the discount amount in rupees.
function applyDiscount(code) {
  code = code.trim().toUpperCase();
  const promotion = promotionCodes[code];
  if (!promotion) {
    showMessage("discountMessage", "Invalid promotion code.", true);
    logFunctionCall("applyDiscount", `code=${code} -> INVALID`);
    return 0;
  }
  if (calculateSubtotal() < promotion.minimumOrder) {
    showMessage("discountMessage", `${code} needs a minimum order of ${formatRupees(promotion.minimumOrder)}.`, true);
    logFunctionCall("applyDiscount", `code=${code} -> below minimum order`);
    return 0;
  }
  discountCode = code;
  const discount = calculateDiscountAmount(calculateSubtotal());
  showMessage("discountMessage", `Promotion code ${code} applied: you save ${formatRupees(discount)}.`);
  logFunctionCall("applyDiscount", `code=${code} -> discount ${formatRupees(discount)}`);
  showSummary();
  return discount;
}

// Discount for the stored promotion code (0 if none, or if the cart fell below its minimum).
function calculateDiscountAmount(subtotal) {
  if (!discountCode) return 0;
  const promotion = promotionCodes[discountCode];
  if (subtotal < promotion.minimumOrder) {
    showMessage("discountMessage", `Promotion code ${discountCode} removed: order is below ${formatRupees(promotion.minimumOrder)}.`, true);
    discountCode = null;
    return 0;
  }
  return promotion.type === "percent" ? (subtotal * promotion.value) / 100 : promotion.value;
}

// ===================== 8. CALCULATE GST =====================
// GST is per category; the discount is shared across items in proportion to their value.
function calculateGST(subtotal, discount) {
  const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  const gst = cart.reduce((sum, cartItem) => sum + (cartItem.price * cartItem.quantity * ratio * gstRates[cartItem.category]) / 100, 0);
  logFunctionCall("calculateGST", `-> GST ${formatRupees(gst)}`);
  return gst;
}

// Show subtotal, discount, GST and grand total.
function showSummary() {
  const subtotal = calculatePrice();
  const discount = calculateDiscountAmount(subtotal);
  const gst = calculateGST(subtotal, discount);
  const total = subtotal - discount + gst;
  getElement("summary").innerHTML = `<table>
    <tr><td>Subtotal</td><td>${formatRupees(subtotal)}</td></tr>
    <tr><td>Discount ${discountCode ? "(" + discountCode + ")" : ""}</td><td>- ${formatRupees(discount)}</td></tr>
    <tr><td>GST (by category)</td><td>${formatRupees(gst)}</td></tr>
    <tr><td class="total">Grand Total</td><td class="total">${formatRupees(total)}</td></tr></table>`;
  return total;
}

// ===================== 9. PAYMENT =====================
function payment(method) {
  if (cart.length === 0) {
    showMessage("paymentMessage", "Cart is empty.", true);
    logFunctionCall("payment", "-> REJECTED, empty cart");
    return null;
  }
  const total = showSummary();
  const orderId = "OD" + Date.now().toString().slice(-8);
  orders[orderId] = { amount: total, method: method, placedAt: Date.now() };
  const paymentText = method === "Cash on Delivery"
    ? `Order placed. Please pay ${formatRupees(total)} on delivery.`
    : `Payment of ${formatRupees(total)} via ${method} successful.`;
  showMessage("paymentMessage", `${paymentText} Order ID: ${orderId}`);
  logFunctionCall("payment", `method=${method}, amount=${total.toFixed(2)} -> order ${orderId}`);
  cart = [];
  discountCode = null;
  renderCart();
  getElement("trackOrderId").value = orderId;
  return orderId;
}

// ===================== 10. ORDER TRACKING =====================
// Demo: every 20 seconds after ordering, the order moves one stage forward.
function orderTracking(orderId) {
  orderId = orderId.trim().toUpperCase();
  const order = orders[orderId];
  if (!order) {
    showMessage("trackMessage", "Order ID not found.", true);
    logFunctionCall("orderTracking", `${orderId} -> NOT FOUND`);
    return null;
  }
  const seconds = (Date.now() - order.placedAt) / 1000;
  const stage = Math.min(Math.floor(seconds / 20), TRACK_STAGES.length - 1);
  getElement("steps").innerHTML = TRACK_STAGES.map((stageName, stageIndex) => `<div class="step ${stageIndex <= stage ? "done" : ""}">${stageName}</div>`).join("");
  showMessage("trackMessage", `Order ${orderId} (${formatRupees(order.amount)}): ${TRACK_STAGES[stage]}`);
  logFunctionCall("orderTracking", `${orderId} -> ${TRACK_STAGES[stage]}`);
  return TRACK_STAGES[stage];
}
