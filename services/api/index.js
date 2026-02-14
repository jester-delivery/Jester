const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const restaurantsRoutes = require("./routes/restaurants");
const ordersRoutes = require("./routes/orders");
const cartOrdersRoutes = require("./routes/cartOrders");

// Route principal
app.get("/", (req, res) => {
  res.json({ message: "Jester API este live 🚀" });
});

// Auth routes
app.use("/auth", authRoutes);

// Me (profile + addresses) - auth required
const meRoutes = require("./routes/me");
app.use("/me", meRoutes);

// Products routes
app.use("/products", productsRoutes);

// Categories routes
app.use("/categories", categoriesRoutes);

// Restaurants routes
app.use("/restaurants", restaurantsRoutes);

// Orders routes
app.use("/orders", ordersRoutes);

// Cart orders (checkout din coș Jester 24/24)
app.use("/cart-orders", cartOrdersRoutes);

// Admin (protejat: auth + ADMIN_EMAILS)
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Eroare internă a serverului",
    code: "INTERNAL_SERVER_ERROR",
  });
});

app.listen(PORT, () => {
  console.log("API ruleaza pe http://localhost:" + PORT);
});
