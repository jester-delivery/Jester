# Audit: Order flow (register → login → checkout → create order → email)

**Data:** 2025-02-13  
**Scop:** Verificare și hardening înainte de livrare client.

---

## 1. Flow verificat

- **Register:** POST `/auth/register` – validare Zod (email, parolă, nume), bcrypt hash, Prisma `user.create`.
- **Login:** POST `/auth/login` – validare, verificare parolă, JWT emis.
- **Checkout:** Frontend trimite POST `/cart-orders` cu JWT și payload (items, total, deliveryAddress, phone, name, notes, paymentMethod).
- **Create order:** API autentifică JWT, validează payload, verifică `userId` (UUID) și existența user în DB, rulează tranzacție Prisma (create CartOrder + CartOrderItems), apoi trimite email de confirmare.
- **Email:** `sendOrderConfirmationEmail` apelat **după** commit; eșecul la email nu anulează comanda (201 returnat oricum).

---

## 2. Tranzacție Prisma

- `prisma.$transaction(async (tx) => { ... })`: create order + items în aceeași tranzacție.
- Rollback: la orice excepție din callback, tranzacția se face rollback; nu există commit parțial.
- Email este în afara tranzacției; nu influențează commit/rollback.

**Concluzie:** Tranzacția este safe; nu există edge cases de rollback problematice.

---

## 3. FK și schema DB

- **cart_orders.user_id:** FK către `users(id)`, ON DELETE SET NULL (migrare `add_user_to_cart_orders`). Valid.
- **cart_order_items.order_id:** FK către `cart_orders(id)` (din schema Prisma). Valid.
- Schema din `prisma/schema.prisma` este acoperită de migrări (inclusiv `estimated_delivery_minutes`, `internal_notes`). Nu s-a identificat discrepanță (ex. P2022).

---

## 4. Modificări aplicate (hardening)

### Validare (`services/api/utils/validation.js`)

- **Register:** email `trim` + `toLowerCase`, max 255; parolă max 128; nume `trim`, max 200; telefon optional, max 20, `trim`.
- **Login:** email `trim` + `toLowerCase`, max 255; parolă max 128.
- **createMvpOrderSchema:**  
  - items: max 100 elemente; fiecare item: name max 200, price max 99999.99, quantity max 99.  
  - total max 999999.99.  
  - deliveryAddress/phone/name: `trim` + max (500 / 20 / 200); notes max 1000, `trim`.
- **Middleware `validate`:** rezultatul `schema.parse(req.body)` este asignat la `req.body`, astfel că transformările (trim, toLowerCase) sunt folosite în rute.

### Sanitizare în ruta cart-orders (`services/api/routes/cartOrders.js`)

- Înainte de Prisma: `deliveryAddress`, `phone`, `name`, `notes` trimite trim; `notes` slice(0, 1000).
- Pentru fiecare item: `name` trim + slice(0, 200); quantity cap 99.

### Rate limiting (`services/api/index.js`)

- `express-rate-limit` activat global: 200 cereri/minut per IP; răspuns 429 cu mesaj în română.

---

## 5. Recomandări ulterioare

- **Email:** Monitorizare/retry pentru `sendOrderConfirmationEmail` (ex. coadă sau job) dacă vrei garanții de livrare.
- **Rate limit:** Pe VPS poți adăuga limită mai strictă pe POST `/auth/login` și POST `/cart-orders` (ex. 10/min) pe lângă limita globală.
- **P2022:** La orice modificare de model Prisma, rulează `prisma migrate dev` și verifică că migrările sunt aplicate pe DB-ul de producție înainte de deploy.

---

**Status:** Flow verificat; tranzacție și FK confirmate; schema în sync; validări, sanitizare și rate limiting aplicate. Gata pentru stabilizare înainte de livrare client.
