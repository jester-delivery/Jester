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

// Route principal
app.get("/", (req, res) => {
  res.json({ message: "Jester API este live 🚀" });
});

// Auth routes
app.use("/auth", authRoutes);

// Products routes
app.use("/products", productsRoutes);

// Categories routes
app.use("/categories", categoriesRoutes);

// Restaurants routes
app.use("/restaurants", restaurantsRoutes);

// Orders routes
app.use("/orders", ordersRoutes);

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
