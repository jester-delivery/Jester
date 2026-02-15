# Regulă: Validare E2E local înainte de VPS

Orice schimbare care atinge **API + DB + auth + order flow** se validează **local E2E**, apoi se urcă pe VPS. VPS = doar confirmare finală.

---

## Flow de validare local

1. **Migrări:** `npx prisma migrate status` → toate aplicate. Dacă lipsește ceva: `npx prisma migrate deploy` (sau `migrate dev` local).
2. **API:** `node index.js` (din `services/api`). Health: `curl -s http://localhost:4000/health` → `{"ok":true,"smtpConfigured":...}`.
3. **Checklist E2E:** register → login → checkout (POST /cart-orders) → orders list (GET /orders/my) → order detail (GET /orders/:id).
4. **Țintă:** POST /cart-orders = **201** mereu + **orderId**; fără erori Prisma (P2022/P2003); fără „place order failed” în UI.

---

## Dacă apare P2022 (ColumnNotFound)

Schema DB ≠ Prisma schema. Pași:

1. `npx prisma migrate status` (local).
2. `npx prisma migrate deploy` (sau `migrate dev`).
3. Verifică că DB are toate coloanele/relațiile din `prisma/schema.prisma`.
4. Repornește API și rulează din nou E2E.

---

## E2E rapid (doar API, cu curl)

Din `services/api`, cu API pornit (`node index.js`):

```bash
# 1. Health
curl -s http://localhost:4000/health
# 2. Register → token
REG=$(curl -s -X POST http://localhost:4000/auth/register -H "Content-Type: application/json" -d '{"email":"e2e-'$(date +%s)'@test.local","password":"parola123","name":"E2E"}')
TOKEN=$(echo "$REG" | node -e "var d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch(e){}});")
# 3. POST /cart-orders (trebuie 201 + orderId)
curl -s -w "\nHTTP:%{http_code}" -X POST http://localhost:4000/cart-orders -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"items":[{"name":"Pizza","price":25.5,"quantity":2}],"total":51,"deliveryAddress":"Strada Test 1","phone":"0712345678","name":"E2E","notes":"","paymentMethod":"CASH_ON_DELIVERY"}'
# 4. GET /orders/my și GET /orders/:id (cu orderId din răspunsul de mai sus)
```

Verifică: ultimul răspuns conține `"success":true,"orderId":"..."` și HTTP:201.

---

## După ce local e verde

- Push pe GitHub cu commit clar (ex: `fix(order): stabilize cart-orders e2e + health + email logs`).
- Pe VPS: `git pull`, `npm i` / `pnpm i`, `npx prisma migrate deploy`, restart pm2, rulează checklist E2E o singură dată (confirmare).
