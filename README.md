# Jester

Platformă de comandă și livrare: client (storefront), admin (produse/categorii), dashboard curier, API și baza de date. Obiectiv: MVP funcțional, polish ulterior.

---

## 1. Intro

**Ce este Jester**  
Platformă pentru comenzi (mâncare, băuturi, livrări) cu flux complet: client plasează comanda, admin gestionează produse și status, curier acceptă/refuză și actualizează livrarea.

**Ce include**
- **Storefront** — aplicația pentru client: catalog (Jester 24/24, pizza, grill etc.), coș, checkout, comenzi, profil.
- **Admin** — secțiune în storefront (protejată după email): CRUD produse, categorii, comenzi, statistici.
- **Courier Dashboard** — secțiune în storefront (protejată după rol): comenzi disponibile, accept/refuz, livrările mele, istoric.
- **API** — Node/Express: auth, produse, categorii, comenzi, cart-orders, curier, admin, health.
- **DB** — PostgreSQL (Docker local): Prisma, migrări / push.

**Obiectiv**  
MVP funcțional end-to-end; îmbunătățiri UI, notificări și deploy ulterior.

---

## 2. Stack & arhitectură

**Monorepo**
- `apps/storefront` — Next.js (client + admin + courier UI).
- `services/api` — Node.js + Express (API + Prisma).
- `scripts/` — `stack.sh` (pornire/oprire stack local).
- `infra/docker/` — `docker-compose.yml` (PostgreSQL).

**Tehnologii**
- Frontend: Next.js, React, Zustand.
- Backend: Node.js, Express, Prisma.
- DB: PostgreSQL (Docker).
- Auth: JWT (API), token în localStorage (storefront).

**Porturi**
| Serviciu   | Port |
|-----------|------|
| Web (Next)| 3001 |
| API       | 4000 |
| Postgres  | 5432 |

---

## 3. Quick start (local)

**Cerințe**
- Node.js (LTS, ex. 18+ sau 20+).
- npm (vine cu Node).
- Docker și Docker Compose (pentru Postgres).

**Pași de pornire (din root repo)**

1. **Instalare dependențe**  
   În root nu e nevoie de `npm install`; fiecare app își instalează singură. La prima rulare:
   - `cd services/api && npm install`
   - `cd apps/storefront && npm install`

2. **Pornire stack (script unic)**  
   Din root:
   - `npm run start` sau `npm run dev`  
   Rulează: Docker Compose (Postgres), apoi `prisma generate` + `prisma db push`, apoi API și storefront în background.

3. **Oprire**  
   Din root: `npm run stop`  
   Oprește procesele de pe 3001/4000 și containerul Postgres.

**Verificare că totul e OK**
- **API:** `curl http://localhost:4000/health` → `{"status":"ok"}`.
- **Web:** deschizi în browser `http://localhost:3001`.
- **DB:** dacă API-ul răspunde la `/health`, Postgres e accesibil (API face `SELECT 1`).

---

## 4. Config / ENV

**Unde sunt fișierele**
- **API:** `services/api/.env` (copie din `services/api/.env.example`).
- **Storefront:** `apps/storefront/.env.local` (copie din `apps/storefront/.env.example`).  
Nu există `.env` în root.

**Variabile obligatorii**

- **API (`services/api/.env`)**
  - `DATABASE_URL` — conexiune Postgres (ex. `postgresql://postgres:PAROLA@localhost:5432/jester`). Local trebuie să coincidă cu user/parolă/DB din `docker-compose.yml`.
  - `JWT_SECRET` — semnătură JWT (min. 32 caractere; în producție: random, secret).
  - `ADMIN_EMAILS` — emailuri admin separate prin virgulă (ex. `admin@example.com,dex@mail.com`). Cine e în listă poate accesa `/admin/*`.

- **Storefront (`apps/storefront/.env.local`)**
  - `NEXT_PUBLIC_API_URL` — URL API (dev: `http://localhost:4000`).

**Opțional (API)**  
`PORT` (implicit 4000), `SMTP_*` pentru email (welcome, confirmare comandă). Dacă SMTP lipsește, aplicația merge fără trimitere email.

**Exemplu minimal (în cuvinte)**  
API: DATABASE_URL către Postgres local, JWT_SECRET lung și random, ADMIN_EMAILS cu cel puțin un email. Storefront: NEXT_PUBLIC_API_URL către http://localhost:4000.

---

## 5. Funcționalități importante (MVP)

- **Categorii și produse din API**  
  Produse au `isActive` (vizibilitate în magazin) și `available` (poate fi adăugat în coș). Admin poate modifica ambele. **BubbleHub** (bulele de pe homepage) citește din API doar categoriile active (`GET /categories?activeOnly=1`), sortate după sortOrder; dacă o categorie e dezactivată în admin, dispare din hub la refresh.

- **Admin**  
  **Produse (Products Manager):** listă cu căutare după nume, filtre (categorie, Vizibil ON/OFF, Disponibil), sortare după sortOrder apoi nume. Edit: nume, descriere, preț, imagine, categorie, isActive, isAvailable, sortOrder. Quick toggles în listă (isActive, isAvailable). Validare: preț > 0, nume obligatoriu.  
  **Categorii (Categories Manager):** listă slug, titlu, isActive, sortOrder, nr produse; edit titlu, descriere (opțional), icon/logo (URL), isActive, sortOrder; quick toggle isActive. Categoriile inactive nu apar în hub.  
  Comenzi, statistici. Acces: utilizator autentificat al cărui email e în `ADMIN_EMAILS`.

- **Orders**  
  Flow status (PENDING → CONFIRMED → PREPARING → ON_THE_WAY → DELIVERED etc.). Timeline status în UI. Comenzi utilizator: `/orders/my`; admin poate actualiza status.

- **Cart-orders (checkout Jester 24/24)**  
  POST cu items, total, livrare; idempotență prin header `Idempotency-Key`; total recalculat pe backend (anti-manipulare). 409 dacă total client ≠ total server.

- **Courier**  
  - **Available** — comenzi PENDING, neasignate, nerefuzate de curierul curent.
  - **Mine** — comenzi acceptate de mine (ACCEPTED / ON_THE_WAY).
  - **History** — livrări finalizate (DELIVERED).
  - **Accept** — atomic: doar dacă încă PENDING și fără curier; altfel 409.
  - **Refuse** — cu motiv opțional; comanda rămâne disponibilă pentru alți curieri.
  - **Lock pe accept** — un singur curier poate lua comanda (update atomic).

- **OrderStatusLog**  
  Audit: fiecare schimbare de status (inclusiv accept/refuz curier) e înregistrată (orderId, previousStatus, newStatus, changedByUserId).

- **Admin stats**  
  Endpoint `/admin/stats/today`: comenzi și venit azi (pentru dashboard).

---

## 6. Roluri și conturi (dev)

**Roluri**
- **USER** — client: comenzi, profil, adrese.
- **COURIER** — curier: dashboard curier, accept/refuz, update status livrare.
- **ADMIN** — definit prin email în `ADMIN_EMAILS` (nu prin câmp `role` în DB). Utilizatorul cu acel email poate accesa `/admin/*`.

**Cum faci un user curier**
- **Prin seed:** la `node prisma/seed.js` (când nu există niciun user), se creează `courier@jester.local` cu rol COURIER.
- **Prin script:** `node scripts/ensure-courier-user.js` în `services/api`. Creează `courier@jester.local` cu parola `parola123` dacă nu există; dacă există, îi setează rolul COURIER.

**Conturi de test (după seed)**
- `test@jester.local` / `parola123` — USER.
- `courier@jester.local` / `parola123` — COURIER.  
Admin: orice user al cărui email e în `ADMIN_EMAILS` (ex. adaugi `test@jester.local` în .env ca admin).

---

## 7. API endpoints (rezumat)

| Modul        | Endpoint (ex.) | Descriere |
|-------------|----------------|-----------|
| **Health**  | `GET /health`  | Status API + DB (200 = ok). |
| **Auth**    | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Înregistrare, login, profil (JWT). |
| **Me**     | `GET /me`, `PATCH /me`, `GET /me/addresses`, `POST /me/addresses`, `PATCH /me/addresses/:id`, `DELETE /me/addresses/:id` | Profil și adrese (auth). |
| **Categories** | `GET /categories`, `GET /categories/:identifier` | Listă categorii, detaliu (slug sau id). |
| **Products** | `GET /products`, `GET /products/:id` | Listă produse (filtre), detaliu. |
| **Restaurants** | `GET /restaurants`, `GET /restaurants/:id` | Listă și detaliu restaurante. |
| **Orders**  | `GET /orders/my`, `GET /orders/:id`, `GET /orders/stream/:orderId`, `PATCH /orders/:id/status`, `DELETE /orders/:id` | Comenzi user, stream SSE, update status (admin), soft delete. |
| **Cart-orders** | `GET /cart-orders`, `POST /cart-orders`, `PATCH /cart-orders/:id/status` | Listă, creare (checkout; Idempotency-Key opțional), update status (admin). |
| **Addresses** | `GET /addresses/search`, `GET /addresses/validate` | Autocomplete și validare adrese (Sulina). |
| **Admin**   | `GET /admin/orders`, `GET /admin/products` (search, category, isActive, available), `PATCH /admin/products/:id`, `GET /admin/categories`, `PATCH /admin/categories/:id`, bulk activate/deactivate, `GET /admin/stats/today` | Comenzi, produse (search/filtre/sortOrder), categorii (isActive, sortOrder), statistici azi. |
| **Courier** | `GET /courier/orders/available`, `POST /courier/orders/:id/accept`, `POST /courier/orders/:id/refuse`, `GET /courier/orders/mine`, `GET /courier/orders/history`, `GET /courier/orders/refused`, `GET /courier/orders/:id`, `POST /courier/orders/:id/status` | Disponibile, accept, refuz, ale mele, istoric, refuzate, detaliu, update status (ON_THE_WAY / DELIVERED). |

Toate rutele de mai sus sunt prefixate de base URL (ex. `http://localhost:4000`). Auth: header `Authorization: Bearer <token>`.

---

## 8. Debug / troubleshooting

- **Postgres nu pornește**  
  Verifică Docker: `docker ps`; containerul `jester-postgres` trebuie să fie Up. Dacă nu: `docker compose -f infra/docker/docker-compose.yml up -d` din root; verifică portul 5432 liber și parola/DB din `DATABASE_URL` identice cu cele din `docker-compose.yml`.

- **API nu trece health check**  
  `/health` face `SELECT 1` pe DB. Dacă primești 500: DB inaccesibil (URL greșit, Postgres oprit, rețea). Verifică `services/api/.env` (DATABASE_URL), apoi că Postgres rulează și că `prisma db push` sau migrările s-au aplicat.

- **Prisma push eșuează**  
  Rulează din `services/api`: `npx prisma generate` apoi `npx prisma db push`. Erori frecvente: DATABASE_URL greșit, Postgres oprit, sau schema incompatibilă cu DB (de ex. coloane lipsă). Pentru migrări: `npx prisma migrate deploy`.

- **Nu apar produse în client**  
  Verifică că ai rulat seed-ul: în `services/api`, `node prisma/seed.js`. Produsele Jester 24/24 trebuie să existe în DB cu același nume ca în catalogul static; altfel checkout-ul poate returna „produs indisponibil”.

- **Comenzi utile (idei)**  
  Health: `curl http://localhost:4000/health`. Oprire procese pe porturi: `fuser -k 4000/tcp 3001/tcp`. Loguri API: consola unde rulează `node index.js`. Prisma Studio: `npx prisma studio` în `services/api` pentru vizualizare date.

---

## 9. Implementări recente

- **Rate limiting (429 – Prea multe cereri):** Limitele sunt **per client (IP)**; fluxul total este nelimitat (fiecare IP are propriul contor). La răspuns 429, utilizatorul (client sau curier) **nu mai este delogat**: token-ul rămâne, se afișează doar mesajul de eroare; după ce fereastra de limită se resetează, totul revine normal. (authStore: `fetchUser` nu șterge token la 429; interceptor API nu face logout la 429; pagini courier afișează mesaj 429 fără redirect la login.)
- **Preview imagini (Jester 24/24):** Tap pe imaginea produsului deschide un modal lightbox (Radix Dialog); ProductRow: doar butoanele +/− adaugă în coș, tap pe imagine pentru preview.

---

## 10. Roadmap scurt

- Polish UI (storefront, admin, courier).
- Notificări (email push, eventual in-app).
- Deploy pe VPS (API + storefront + Postgres sau DB managed).
- CI (teste, lint, eventual deploy automat).

---

README „de proiect real”: intro clar, stack, quick start copy-paste, ENV, funcționalități MVP, roluri/conturi, overview API, troubleshooting, roadmap scurt. Fără cod inutil; structurat pentru ca oricine să înțeleagă ce e Jester, cum pornește și cum se lucrează local.
