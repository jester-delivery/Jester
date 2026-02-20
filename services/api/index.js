const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting: per client (IP) – implicit în express-rate-limit; flux total nelimitat (fiecare IP are propriul contor)
// General 100 cereri/minut per IP (vezi header-ele RateLimit-* în răspuns). Auth 10/min; POST cart-orders 30/min.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Prea multe cereri. Încearcă din nou mai târziu.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Prea multe încercări. Încearcă din nou în câteva minute.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Limiter efectiv pentru POST /cart-orders e în routes/cartOrders.js: 3 comenzi/min per IP
const cartOrderCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Prea multe comenzi. Maxim 3 pe minut. Încearcă mai târziu.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Health – verifică conexiunea la DB; 200 { status: "ok" } sau 500
const prisma = require("./utils/prisma");
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[health] DB check failed:", err);
    res.status(500).json({ status: "error", error: "DB unreachable" });
  }
});

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

// Auth routes (rate limit strict: 10/min per IP)
app.use("/auth", authLimiter, authRoutes);

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

// Cart orders (checkout din coș Jester 24/24); POST limitat la 30/min în router
app.use("/cart-orders", cartOrdersRoutes);

// Addresses – autocomplete Sulina + validare (public)
const addressesRoutes = require("./routes/addresses");
app.use("/addresses", addressesRoutes);

// Admin (protejat: auth + ADMIN_EMAILS)
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

// Courier (protejat: auth + rol COURIER sau ADMIN)
const courierRoutes = require("./routes/courier");
app.use("/courier", courierRoutes);

// Notificări (lista pentru /notificati + dismiss prin swipe)
const notificationsRoutes = require("./routes/notifications");
app.use("/notifications", notificationsRoutes);

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
