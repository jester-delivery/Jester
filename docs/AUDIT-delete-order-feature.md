# Audit – Feature „Șterge comandă” (Comenzile mele)

**Data audit:** 2025-02-13  
**Scope:** Backend (orders), Frontend (orders page + API), Prisma schema.

---

## 1. Rezumat

| Categorie        | Status | Note |
|------------------|--------|------|
| Schema Prisma    | ✅     | `CartOrder.deletedAt` prezent |
| Migrare DB       | ⚠️     | **Lipsește** – coloana `deleted_at` poate să nu existe în DB |
| Backend logică   | ✅     | GET filter, GET :id, DELETE :id corecte |
| Ordine rute      | ✅     | `/my` și `/stream/:orderId` înainte de `/:id` |
| Frontend API     | ✅     | `delete(id)`, `getMy(params?)` |
| Frontend UI      | ✅     | Buton Trash2, modal confirmare, optimistic update |
| Consistență      | ✅     | Doar PENDING ștergibil (backend + frontend) |

---

## 2. Probleme identificate

### 2.1 Critică: migrare pentru `deleted_at`

- **Ce:** În `schema.prisma`, modelul `CartOrder` are câmpul `deletedAt DateTime? @map("deleted_at")`, dar **nu există nicio migrare** care să adauge coloana în baza de date.
- **Risc:** La rularea DELETE `/orders/:id`, `prisma.cartOrder.update({ data: { deletedAt: new Date() } })` poate arunca eroare (coloană inexistentă).
- **Acțiune:** Rulează în `services/api`:
  ```bash
  npx prisma migrate dev --name add_cart_order_deleted_at
  ```
  sau `npx prisma db push` dacă nu folosești migrări versionate.

---

### 2.2 Minor: mesaj la eroare 400 la delete (double-click)

- **Ce:** Dacă utilizatorul apasă „Șterge” de două ori rapid sau comanda a fost deja ștearsă, backend poate returna **400** (ex. `ALREADY_DELETED` sau `ORDER_NOT_DELETABLE`). Frontend tratează orice eroare la `api.orders.delete()` ca „Eroare la ștergere. Reîncarcăm lista.” – deci utilizatorul vede mesaj de eroare chiar dacă comanda a fost de fapt ștearsă.
- **Impact:** UX ușor confuz; logic (reîncărcarea listei) este corect.
- **Acțiune opțională:** În `handleDeleteOrder`, pentru status 400 sau 404 la delete, nu afișa toast de eroare (sau afișează „Comandă deja ștearsă”) și nu reîncărca lista (sau reîncarcă fără mesaj de eroare).

---

### 2.3 Minor: accesibilitate modal – tasta Escape

- **Ce:** Modalul „Ștergi comanda?” se închide la click pe overlay și la „Anulează”, dar **nu** la tasta **Escape**.
- **Acțiune opțională:** Adaugă `useEffect` care ascultă `keydown` pentru `Escape` și apelează același handler ca la Anulează.

---

### 2.4 Opțional: `includeDeleted` disponibil pentru orice user

- **Ce:** Parametrul `?includeDeleted=1` la GET `/orders/my` este permis pentru orice utilizator autentificat. Utilizatorul își poate vedea și comenzile proprii șterse (soft-deleted).
- **Evaluare:** Acceptabil – sunt datele proprii. Dacă în viitor vrei ca doar admin să vadă șterse, poți verifica rolul în rută și permite `includeDeleted` doar pentru admin.

---

## 3. Ce funcționează corect

### Backend (`services/api/routes/orders.js`)

- **GET /orders/my:** Filtrare `deletedAt: null`; `?includeDeleted=1` pentru listare cu șterse.
- **GET /orders/:id:** `findFirst` cu `userId` + `deletedAt: null` → comanda ștearsă sau a altui user = 404.
- **DELETE /orders/:id:** Verificare `userId`, verificare `deletedAt` (deja ștearsă → 400), verificare status în `DELETABLE_STATUSES` (doar `PENDING`), soft delete cu `deletedAt: new Date()`, răspuns 204.
- Ordinea rutelor: `/my` și `/stream/:orderId` sunt definite înainte de `/:id`, deci nu există conflict.

### Frontend

- **API:** `api.orders.delete(id)` și `api.orders.getMy({ includeDeleted: '1' })` opțional.
- **OrderCard:** Buton Trash2 (lucide-react) doar pentru `order.status === 'PENDING'`; modal cu titlu/text/butoane conform specificației; `e.preventDefault()` / `e.stopPropagation()` pentru a nu naviga la detaliu.
- **handleDeleteOrder:** Optimistic remove din listă, toast „Comandă ștearsă”, apel DELETE; la catch: toast eroare + `fetchOrders()`.

### Pagina de detaliu `/orders/[id]`

- `api.orders.getById(id)` pentru comenzi șterse returnează 404 (backend exclude `deletedAt !== null`), deci utilizatorul vede „Comanda nu a fost găsită.” – comportament corect.

---

## 4. Checklist rapid

- [ ] Rulat migrare (sau `db push`) pentru `deleted_at` în `cart_orders`.
- [ ] (Opțional) Tratare 400/404 la delete fără mesaj de eroare confuz.
- [ ] (Opțional) Închidere modal la Escape.
- [ ] (Opțional) Bonus: filtru „Arată șterse” în UI cu `getMy({ includeDeleted: '1' })`.

---

## 5. Concluzie

Implementarea este **coerentă și sigură**. Singura acțiune **obligatorie** este aplicarea migrării pentru `deleted_at`; restul sunt îmbunătățiri minore de UX și opționale.
