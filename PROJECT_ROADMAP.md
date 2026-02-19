# 🎯 Jester - Project Roadmap

**Ultima actualizare:** 15 Februarie 2026  
**Status proiect:** 🟡 În dezvoltare (MVP)  
**Backend MVP:** ✅ Complet

---

## 📌 Status curent – DONE / IN PROGRESS / NEXT

### ✅ DONE
- **Auth:** Login, Register, JWT, mesaje clare (Email deja folosit, Parolă greșită)
- **Orders legat de user:** POST /cart-orders cu userId din JWT, checkout cere login
- **My Orders:** GET /orders/my, GET /orders/:id cu guard owner
- **Profile + Addresses:** GET/PATCH /me, CRUD /me/addresses, default address
- **Checkout:** selector adrese din Address Book, prefill nume/telefon, validări RO phone
- **Status flow:** PENDING → CONFIRMED → PREPARING → ON_THE_WAY → DELIVERED, CANCELED doar din PENDING/CONFIRMED
- **Admin:** GET /admin/orders (protejat), PATCH /orders/:id/status cu ETA + internalNotes
- **Admin Products Manager (TASK 5):** GET /admin/products cu search, category, isActive, available; sortare sortOrder + name; PATCH produs (name, price, image, category, isActive, available, sortOrder); validare price > 0, name required; UI: listă cu search + filtre, edit form cu sortOrder, quick toggles isActive/available
- **Admin Categories Manager (TASK 6):** Category: description, isActive, sortOrder; GET /categories?activeOnly=1; GET/PATCH /admin/categories; UI: listă categorii (slug, titlu, isActive, sortOrder), edit (titlu, descriere, icon, isActive, sortOrder), quick toggle isActive
- **BubbleHub din API:** hub-ul citește GET /categories?activeOnly=1; doar categorii active, sortate; categorie OFF dispare din hub; la refresh clientul vede ordinea din admin
- **Real-time Order Status:** SSE GET /orders/stream/:orderId – update instant când admin schimbă status, toast „Comanda ta e în drum”
- **Notificări client:** SSE pe order detail (înlocuie polling), polling 8s pe lista Orders, toast + vibrație, badge „Comandă live”
- **Hardening:** validări Zod (adresă min 5, telefon RO, nume min 2), admin doar pentru ADMIN_EMAILS

### 🔄 IN PROGRESS
- N/A

### 📋 NEXT (prioritate pentru mâine)
1. **Customer Experience polish** – banner „Ai o comandă în curs”, highlight comandă activă
2. **Search simplu** – search bar global, debounce 300ms, client-side
3. **ETA logic** – countdown „Livrare în ~18 min”, recalcul automat
4. **După:** Push notifications, VPS deploy, subdomain live

---

## 📋 Scopul Aplicației

**Jester** este o platformă de food delivery disponibilă 24/7, care permite utilizatorilor să comande mâncare de la multiple restaurante și categorii (Pizza, Grill, Bake, Supply, etc.) și să o primească la domiciliu prin serviciul de delivery dedicat.

### Caracteristici principale:
- 🍕 Comenzi de mâncare online 24/7
- 🚚 Delivery rapid și eficient
- 📱 Interfață modernă și intuitivă pentru clienți
- 👨‍💼 Panou de administrare pentru restaurante
- 🏍️ Aplicație pentru curieri
- 🎨 Multiple categorii de produse (Pizza, Grill, Bake, Supply, Antiq, Jester 24/24)

---

## 🏗️ Arhitectura Actuală

### Structura Monorepo

```
jester/
├── apps/
│   ├── storefront/     # Aplicația principală pentru clienți (Next.js)
│   ├── admin/          # Panou de administrare (planificat)
│   └── courier/        # Aplicație pentru curieri (planificat)
├── services/
│   ├── api/            # Backend API REST (Express.js)
│   └── worker/         # Servicii background jobs (planificat)
├── infra/
│   ├── docker/         # Configurații Docker (planificat)
│   └── nginx/          # Configurații Nginx (planificat)
└── docs/               # Documentație
```

### Stack Tehnologic

#### Frontend (Storefront)
- **Framework:** Next.js 16.1.6 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **Fonts:** Geist (Google Fonts)

#### Backend (API)
- **Framework:** Express.js 5.2.1
- **Language:** JavaScript (Node.js)
- **Middleware:** CORS, dotenv
- **Port:** 4000 (configurabil prin env)

#### Infrastructură
- Docker (planificat)
- Nginx (planificat)

---

## ✅ Ce Este Deja Implementat

### Frontend (Storefront)

#### ✅ Pagina Principală (`/`)
- [x] Design modern cu gradient background și efecte glassmorphism
- [x] TopBar cu input pentru adresă și buton de filtre
- [x] Hub cu categorii de produse (bubbles):
  - Jester 24/24 (categorie principală)
  - Pizza
  - Supply
  - Grill
  - Bake
  - Jester Delivery
  - Antiq
- [x] Bottom Navigation Bar cu:
  - Home
  - Search
  - Orders
  - Profile
- [x] Responsive design optimizat pentru mobile
- [x] Configurație Next.js cu suport pentru imagini externe (imgur.com)
- [x] TypeScript configurat

#### ✅ Pagini Implementate (februarie 2026)
- [x] `/orders` - Comenzile mele (GET /orders/my), redirect login dacă neautentificat
- [x] `/orders/[id]` - Detalii comandă + timeline + polling 5s + badge „Comandă live”
- [x] `/profile` - Profil editabil (nume, telefon), link adrese salvate
- [x] `/addresses` - CRUD adrese, set default
- [x] `/login`, `/register` - cu redirect ?next= după auth
- [x] `/jester-24-24` - Categorie Jester 24/24 cu coș
- [x] `/jester-24-24/checkout` - Checkout cu selector adrese, validări
- [x] `/jester-24-24/admin` - Admin comenzi (protejat ADMIN_EMAILS)

#### ⚠️ Pagini Parțial Implementate
- [ ] `/search` - Link există, pagină neimplementată
- [ ] `/pizza`, `/supply`, `/grill`, `/bake`, `/delivery`, `/antiq` - Link-uri există, pagini neimplementate

### Backend (API)

#### ✅ Infrastructură de Bază
- [x] Server Express.js configurat
- [x] CORS activat
- [x] Middleware pentru JSON parsing
- [x] Configurare dotenv pentru variabile de mediu
- [x] Ruta principală `/` (health check)

#### ✅ Endpoints Implementate
- [x] `GET /` - Health check endpoint
- [x] `GET /products` - Listă de produse mock (2 produse de test)

#### ✅ Backend Implementat (februarie 2026)
- [x] Baza de date PostgreSQL + Prisma
- [x] Autentificare JWT (login, register, authenticateToken)
- [x] GET/PATCH /me, CRUD /me/addresses
- [x] POST /cart-orders (auth, validări Zod)
- [x] GET /orders/my, GET /orders/:id (auth, guard owner)
- [x] PATCH /orders/:id/status (auth + requireAdmin)
- [x] GET /admin/orders (auth + requireAdmin)

#### ⚠️ Funcționalități Lipsă
- [ ] Integrare plăți
- [ ] SSE/WebSocket pentru notificări real-time
- [ ] Push notifications

### Infrastructură

#### ⚠️ Neimplementat
- [ ] Docker Compose pentru development
- [ ] Dockerfile pentru fiecare serviciu
- [ ] Configurație Nginx pentru reverse proxy
- [ ] CI/CD pipeline
- [ ] Environment variables management
- [ ] Logging și monitoring

---

## ❌ Ce Lipsește

### 🔴 Critic pentru MVP

#### Backend
1. **Baza de Date**
   - [ ] Alegere și configurare DB (PostgreSQL recomandat)
   - [ ] Schema bazei de date (utilizatori, produse, comenzi, restaurante)
   - [ ] ORM/Query builder (Prisma/Sequelize/TypeORM)
   - [ ] Migrations

2. **Autentificare**
   - [ ] Sistem de înregistrare/login
   - [ ] JWT tokens
   - [ ] Refresh tokens
   - [ ] Password hashing (bcrypt)
   - [ ] Middleware de autentificare

3. **API Endpoints Esențiale**
   - [ ] `POST /auth/register` - Înregistrare utilizator
   - [ ] `POST /auth/login` - Login utilizator
   - [ ] `GET /products` - Listă produse (cu filtrare, paginare)
   - [ ] `GET /products/:id` - Detalii produs
   - [ ] `GET /categories` - Listă categorii
   - [ ] `POST /orders` - Creare comandă
   - [ ] `GET /orders` - Listă comenzi utilizator
   - [ ] `GET /orders/:id` - Detalii comandă
   - [ ] `PUT /orders/:id/status` - Actualizare status comandă
   - [ ] `GET /restaurants` - Listă restaurante
   - [ ] `GET /restaurants/:id` - Detalii restaurant

4. **Validare și Error Handling**
   - [ ] Validare input (Joi/Zod)
   - [ ] Error handling middleware
   - [ ] Logging structurat

#### Frontend (Storefront)
1. **Pagini Principale**
   - [ ] Pagină `/search` - Căutare produse
   - [ ] Pagină `/orders` - Istoric comenzi
   - [ ] Pagină `/profile` - Profil utilizator
   - [ ] Pagină `/products/:category` - Listă produse pe categorie
   - [ ] Pagină `/products/:id` - Detalii produs
   - [ ] Pagină `/cart` - Coș de cumpărături
   - [ ] Pagină `/checkout` - Finalizare comandă

2. **Funcționalități**
   - [ ] State management (Context API / Zustand / Redux)
   - [ ] Integrare cu API backend
   - [ ] Autentificare (login/register)
   - [ ] Coș de cumpărături persistent
   - [ ] Formulare de comandă
   - [ ] Tracking comandă în timp real
   - [ ] Gestionare adrese de livrare

3. **UI/UX**
   - [ ] Loading states
   - [ ] Error states
   - [ ] Empty states
   - [ ] Toast notifications
   - [ ] Modal pentru detalii produs
   - [ ] Optimizare imagini

#### Aplicații Suplimentare
1. **Admin Panel** (`apps/admin`)
   - [ ] Setup Next.js/React
   - [ ] Dashboard cu statistici
   - [ ] Management produse
   - [ ] Management comenzi
   - [ ] Management restaurante
   - [ ] Management utilizatori

2. **Courier App** (`apps/courier`)
   - [ ] Setup Next.js/React Native
   - [ ] Login pentru curieri
   - [ ] Listă comenzi disponibile
   - [ ] Acceptare comandă
   - [ ] Tracking GPS
   - [ ] Actualizare status livrare

### 🟡 Important pentru Versiune Stabilă

1. **Plăți**
   - [ ] Integrare gateway plăți (Stripe/PayPal)
   - [ ] Procesare plăți
   - [ ] Webhooks pentru plăți

2. **Notificări**
   - [ ] Email notifications (SendGrid/Nodemailer)
   - [ ] Push notifications
   - [ ] SMS notifications (opțional)

3. **Performance**
   - [ ] Caching (Redis)
   - [ ] CDN pentru assets
   - [ ] Optimizare queries DB
   - [ ] Image optimization

4. **Securitate**
   - [ ] Rate limiting
   - [ ] Input sanitization
   - [ ] HTTPS/SSL
   - [ ] Security headers

5. **Testing**
   - [ ] Unit tests (Jest/Vitest)
   - [ ] Integration tests
   - [ ] E2E tests (Playwright/Cypress)

### 🟢 Nice to Have

1. **Features Avansate**
   - [ ] Recomandări AI pentru produse
   - [ ] Program de loialitate
   - [ ] Review-uri și rating-uri
   - [ ] Chat support
   - [ ] Multi-language support

2. **Analytics**
   - [ ] Dashboard analytics
   - [ ] Tracking utilizatori
   - [ ] Rapoarte vânzări

---

## 🗺️ Plan pe Etape

### 📍 Etapa 1: MVP (Minimum Viable Product)
**Durată estimată:** 4-6 săptămâni  
**Status:** 🟡 În progres  
**Focus:** Client web funcțional + Backend API de bază

#### Obiectiv MVP
O versiune funcțională minimă care permite utilizatorilor să:
- Se înregistreze și să se autentifice
- Vizualizeze produsele disponibile din baza de date
- Adauge produse în coș și plaseze o comandă
- Vizualizeze statusul comenzilor

**Criterii de "Done" pentru MVP:**
- ✅ Utilizatorii pot să se înregistreze și să se autentifice
- ✅ Utilizatorii pot să vadă produsele disponibile din DB
- ✅ Utilizatorii pot să adauge produse în coș
- ✅ Utilizatorii pot să plaseze o comandă care se salvează în DB
- ✅ Utilizatorii pot să vadă statusul comenzilor
- ✅ Aplicația rulează local (cu sau fără Docker)
- ✅ Nu există erori critice care blochează flow-ul principal

---

#### 🎯 Task-uri MVP - Prioritizate

##### **P0 - CRITIC (Blocant pentru MVP)**

**MVP-P0-1: Setup Baza de Date și Schema** ✅ **COMPLETAT**  
**Prioritate:** P0 🔴  
**Dependențe:** Niciuna  
**Estimare:** 1-2 zile  
**Status:** ✅ Finalizat pe 13 Februarie 2026

**Task-uri:**
- [x] Instalare PostgreSQL (Docker container: `jester-postgres`)
- [x] Setup Prisma ORM în `services/api` (Prisma 7.4.0)
- [x] Creare schema Prisma cu modelele:
  - User (id, email, passwordHash, name, phone, createdAt, updatedAt)
  - Product (id, name, description, price, image, categoryId, restaurantId, available, createdAt, updatedAt)
  - Category (id, name, slug, image, createdAt, updatedAt)
  - Restaurant (id, name, description, address, phone, image, createdAt, updatedAt)
  - Order (id, userId, status, total, deliveryAddress, createdAt, updatedAt)
  - OrderItem (id, orderId, productId, quantity, price, createdAt, updatedAt)
- [x] Rulare migrations (`prisma migrate dev`)
- [x] Seed date de test (7 categorii, 2 restaurante, 11 produse)

**Criterii "Done":**
- ✅ Prisma configurat și conectat la PostgreSQL
- ✅ Toate modelele create și migrate-uite
- ✅ Date de test populate în DB (7 categorii, 2 restaurante, 11 produse)
- ✅ Poți face query-uri de test din Prisma Studio sau script

---

**MVP-P0-2: Autentificare Backend (Register/Login)** ✅ **COMPLETAT**  
**Prioritate:** P0 🔴  
**Dependențe:** MVP-P0-1 (necesită User model)  
**Estimare:** 1-2 zile  
**Status:** ✅ Finalizat pe 13 Februarie 2026

**Task-uri:**
- [x] Instalare dependențe: `jsonwebtoken`, `bcrypt`, `zod` (validare)
- [x] Implementare `POST /auth/register`
  - Validare input cu Zod (email, password min 6 chars, name)
  - Verificare dacă email există deja
  - Hash password cu bcrypt (10 rounds)
  - Creare utilizator în DB
  - Generare JWT token (expiresIn: 7d)
  - Returnare: `{ token, user: { id, email, name } }`
- [x] Implementare `POST /auth/login`
  - Validare input cu Zod
  - Găsire utilizator după email
  - Verificare password cu bcrypt.compare
  - Generare JWT token
  - Returnare: `{ token, user: { id, email, name } }`
- [x] Creare middleware `authenticateToken` pentru protecție rute
  - Extrage token din Authorization header
  - Verifică și validează token-ul
  - Adaugă userId în req.userId
- [x] Implementare `GET /auth/me` (profil utilizator curent)
  - Protejat cu authenticateToken middleware
  - Returnează informații utilizator (fără passwordHash)

**Criterii "Done":**
- ✅ Poți înregistra un utilizator nou prin API
- ✅ Poți face login și primești JWT token
- ✅ Token-ul JWT funcționează pentru protecție rute
- ✅ `GET /auth/me` returnează utilizatorul autentificat
- ✅ Passwords sunt hash-uite (nu plain text în DB)
- ✅ Validare input funcționează corect
- ✅ Error handling implementat pentru toate cazurile

---

**MVP-P0-3: API Produse și Comenzi** ✅ **COMPLETAT**  
**Prioritate:** P0 🔴  
**Dependențe:** MVP-P0-1 (necesită modele Product, Order), MVP-P0-2 (pentru protecție rute)  
**Estimare:** 2-3 zile  
**Status:** ✅ Finalizat pe 13 Februarie 2026

**Task-uri:**

**Produse:**
- [x] Refactor `GET /products` (conectare la DB, înlocuire mock)
  - Query produse din DB cu Prisma
  - Filtrare după categorie (slug sau id) - query param `?category=`
  - Filtrare după restaurant - query param `?restaurant=`
  - Filtrare după disponibilitate - query param `?available=true/false`
  - Paginare (limit/offset)
  - Returnare: `{ products: [...], total, page, limit, totalPages }`
  - Include relații cu category și restaurant
- [x] Implementare `GET /products/:id` (detalii produs)
  - Include detalii complete: category, restaurant
- [x] Implementare `GET /categories` (listă categorii)
  - Include count de produse pentru fiecare categorie
- [x] Implementare `GET /categories/:identifier` (detalii categorie)
  - Acceptă id sau slug
  - Include produse disponibile (limit 10 pentru preview)
- [x] Implementare `GET /restaurants` (listă restaurante)
  - Include count de produse pentru fiecare restaurant
- [x] Implementare `GET /restaurants/:id` (detalii restaurant)
  - Include produse disponibile cu categorii

**Comenzi:**
- [x] Implementare `POST /orders` (protejat cu authenticateToken)
  - Validare input cu Zod: `{ items: [{ productId, quantity }], deliveryAddress }`
  - Verificare că produsele există și sunt disponibile
  - Calculare total (suma price * quantity pentru fiecare item)
  - Creare Order în DB cu status: "PENDING" (tranzacție)
  - Creare OrderItem-uri asociate
  - Returnare: `{ order: { id, status, total, items: [...] } }`
- [x] Implementare `GET /orders` (comenzile utilizatorului autentificat)
  - Filtrare după userId din token
  - Filtrare după status (opțional)
  - Include OrderItem-uri cu detalii produs, category, restaurant
  - Paginare
  - Sortare după createdAt desc
- [x] Implementare `GET /orders/:id` (detalii comandă specifică)
  - Verificare că comandă aparține utilizatorului autentificat
  - Include toate detaliile: items, user, products, categories, restaurants
- [x] Implementare `PUT /orders/:id/status` (actualizare status)
  - Validare status cu Zod enum
  - Verificare permisiuni (utilizatorul poate actualiza comenzile sale)
  - Status-uri: PENDING → CONFIRMED → PREPARING → READY → DELIVERING → DELIVERED

**Error Handling:**
- [x] Middleware error handling global în index.js
- [x] Validare input cu Zod pentru toate endpoint-urile
- [x] Returnare erori structurate: `{ error: "message", code: "ERROR_CODE" }`
- [x] Error handling pentru toate cazurile (404, 400, 500)

**Criterii "Done":**
- ✅ `GET /products` returnează produse din DB (nu mock)
- ✅ Poți filtra produse după categorie/restaurant/disponibilitate
- ✅ Paginare funcționează corect
- ✅ `POST /orders` creează comandă în DB cu toate item-urile (tranzacție)
- ✅ `GET /orders` returnează doar comenzile utilizatorului autentificat
- ✅ `GET /orders/:id` verifică permisiunile corect
- ✅ Toate erorile sunt returnate într-un format consistent
- ✅ Validarea input funcționează (test cu date invalide)
- ✅ Toate endpoint-urile testate și funcționale ✅

---

##### **P1 - IMPORTANT (Necesar pentru MVP complet)**

**MVP-P1-1: State Management și API Client Frontend**  
**Prioritate:** P1 🟡  
**Dependențe:** Niciuna (poate fi făcut în paralel cu backend)  
**Estimare:** 1 zi

**Task-uri:**
- [ ] Instalare Zustand: `npm install zustand`
- [ ] Creare store pentru auth (`stores/authStore.ts`)
  - State: `user`, `token`, `isAuthenticated`
  - Actions: `login`, `logout`, `setUser`
- [ ] Creare store pentru coș (`stores/cartStore.ts`)
  - State: `items: [{ productId, quantity, product }]`
  - Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - Persistență în localStorage
- [ ] Creare API client (`lib/api.ts`)
  - Axios instance cu baseURL
  - Interceptor pentru adăugare JWT token în headers
  - Interceptor pentru refresh token (opțional pentru MVP)
  - Funcții helper: `get`, `post`, `put`, `delete`
- [ ] Setup error handling global (toast notifications)

**Criterii "Done":**
- ✅ Zustand stores funcționale pentru auth și cart
- ✅ API client poate face request-uri cu JWT token
- ✅ Token-ul este adăugat automat în headers
- ✅ Coșul persistă în localStorage

---

**MVP-P1-2: Pagini Autentificare Frontend**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP-P1-1 (necesită authStore și API client)  
**Estimare:** 1-2 zile

**Task-uri:**
- [ ] Creare pagină `/login`
  - Formular cu email și password
  - Validare client-side
  - Apelare `POST /auth/login`
  - Salvare token în store și localStorage
  - Redirect către `/` după login
- [ ] Creare pagină `/register`
  - Formular cu email, password, name
  - Validare client-side
  - Apelare `POST /auth/register`
  - Auto-login după înregistrare
- [ ] Creare componentă `ProtectedRoute` pentru protecție rute
- [ ] Update BottomNav: afișare "Logout" dacă autentificat

**Criterii "Done":**
- ✅ Poți să te înregistrezi și să te loghezi din UI
- ✅ După login, ești redirectat și token-ul este salvat
- ✅ Rutele protejate redirecționează către `/login` dacă neautentificat
- ✅ Poți să te deloghezi

---

**MVP-P1-3: Pagini Produse Frontend**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP-P0-3 (API produse), MVP-P1-1 (API client)  
**Estimare:** 2 zile

**Task-uri:**
- [ ] Creare pagină `/products/:category` (ex: `/pizza`)
  - Fetch produse din `GET /products?category=...`
  - Afișare grid de produse
  - Loading state
  - Empty state (dacă nu sunt produse)
- [ ] Creare componentă `ProductCard`
  - Imagine produs
  - Nume, preț
  - Buton "Adaugă în coș"
- [ ] Creare pagină `/products/:id` (detalii produs)
  - Fetch produs din `GET /products/:id`
  - Afișare detalii complete
  - Selectare cantitate
  - Buton "Adaugă în coș" (care adaugă în cartStore)
- [ ] Implementare căutare în `/search`
  - Input căutare
  - Filtrare produse după nume

**Criterii "Done":**
- ✅ Poți naviga la categorii și vezi produsele din DB
- ✅ Poți vedea detalii produs
- ✅ Poți adăuga produse în coș din paginile de produse
- ✅ Căutarea funcționează

---

**MVP-P1-4: Coș și Checkout Frontend**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP-P1-1 (cartStore), MVP-P0-3 (API comenzi), MVP-P1-2 (autentificare)  
**Estimare:** 2-3 zile

**Task-uri:**
- [ ] Creare pagină `/cart`
  - Afișare items din cartStore
  - Modificare cantități
  - Ștergere items
  - Calculare total
  - Buton "Continuă la checkout"
- [ ] Creare pagină `/checkout`
  - Formular adresă livrare (required)
  - Rezumat comandă (items + total)
  - Buton "Plasează comandă"
  - Apelare `POST /orders` cu items și adresă
  - Loading state în timpul trimiterii
  - Success: redirect către `/orders/:id`
  - Error handling
- [ ] Update BottomNav: badge cu număr items în coș

**Criterii "Done":**
- ✅ Poți vedea coșul cu toate produsele adăugate
- ✅ Poți modifica cantitățile sau șterge items
- ✅ Poți plasa o comandă care se salvează în DB
- ✅ După comandă, ești redirectat către pagina comenzii
- ✅ Coșul se golește după comandă plasată cu succes

---

**MVP-P1-5: Pagini Comenzi Utilizator**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP-P0-3 (API comenzi), MVP-P1-2 (autentificare)  
**Estimare:** 1-2 zile

**Task-uri:**
- [ ] Creare pagină `/orders`
  - Fetch comenzi din `GET /orders`
  - Listă comenzi cu status și total
  - Link către detalii fiecare comandă
  - Empty state (dacă nu are comenzi)
- [ ] Creare pagină `/orders/:id`
  - Fetch comandă din `GET /orders/:id`
  - Afișare detalii complete: items, adresă, status, total
  - Tracking status (pending → confirmed → preparing → ready → delivered)

**Criterii "Done":**
- ✅ Poți vedea lista comenzilor tale
- ✅ Poți vedea detalii complete pentru fiecare comandă
- ✅ Status-ul comenzii este afișat corect

---

##### **P2 - NICE TO HAVE (Poate fi amânat)**

**MVP-P2-1: Pagină Profil Utilizator**  
**Prioritate:** P2 🟢  
**Dependențe:** MVP-P1-2 (autentificare)  
**Estimare:** 1 zi

**Task-uri:**
- [ ] Creare pagină `/profile`
  - Afișare informații utilizator (din `GET /auth/me`)
  - Editare nume și telefon (opțional pentru MVP)
  - Gestionare adrese salvate (opțional pentru MVP)

**Criterii "Done":**
- ✅ Poți vedea informațiile tale de profil

---

**MVP-P2-2: UI/UX Polish**  
**Prioritate:** P2 🟢  
**Dependențe:** Toate task-urile P0 și P1  
**Estimare:** 2-3 zile

**Task-uri:**
- [ ] Adăugare loading states peste tot
- [ ] Adăugare error states (când API eșuează)
- [ ] Toast notifications pentru acțiuni (success/error)
- [ ] Optimizare imagini (Next.js Image component)
- [ ] Responsive design improvements
- [ ] Animații și tranziții smooth

**Criterii "Done":**
- ✅ Aplicația arată profesional și este user-friendly
- ✅ Toate stările (loading, error, empty) sunt gestionate

---

**MVP-P2-3: Docker Setup**  
**Prioritate:** P2 🟢  
**Dependențe:** Toate task-urile P0 și P1  
**Estimare:** 1 zi

**Task-uri:**
- [ ] Creare Dockerfile pentru API
- [ ] Creare Dockerfile pentru Storefront
- [ ] Creare docker-compose.yml (PostgreSQL + API + Storefront)
- [ ] Documentare setup local cu Docker

**Criterii "Done":**
- ✅ Poți rula întregul stack cu `docker-compose up`
- ✅ Toate serviciile comunica corect între ele

---

### 📍 Etapa 2: Beta
**Durată estimată:** 4-6 săptămâni  
**Status:** ⏳ Planificat  
**Focus:** Admin Dashboard + Courier Workflow + Features avansate

#### Obiectiv Beta
O versiune stabilă, testată, cu toate aplicațiile (Client + Admin + Courier) funcționale, gata pentru utilizatori reali.

**Criterii de "Done" pentru Beta:**
- ✅ Admin panel complet funcțional
- ✅ Courier app cu workflow complet
- ✅ Plăți integrate și funcționale
- ✅ Notificări (email) funcționale
- ✅ Performance optimizat
- ✅ Securitate auditată
- ✅ Teste automate pentru flow-uri critice

---

#### 🎯 Task-uri Beta - Prioritizate

##### **BETA-P0: Admin Dashboard**

**BETA-P0-1: Setup Admin App**  
**Prioritate:** P0 🔴  
**Dependențe:** MVP complet  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Setup Next.js app în `apps/admin`
- [ ] Autentificare admin (role-based: admin)
- [ ] Dashboard cu statistici (comenzi zilnice, venituri, produse populare)
- [ ] CRUD produse (creare, editare, ștergere)
- [ ] Management comenzi (vizualizare, actualizare status)
- [ ] Management restaurante (CRUD)
- [ ] Management utilizatori (vizualizare, blocare)

**Criterii "Done":**
- ✅ Admin poate gestiona produse, comenzi, restaurante
- ✅ Dashboard afișează statistici relevante

---

**BETA-P0-2: Courier App**  
**Prioritate:** P0 🔴  
**Dependențe:** MVP complet  
**Estimare:** 1-2 săptămâni

**Task-uri:**
- [ ] Setup Next.js app în `apps/courier` (sau React Native pentru mobile)
- [ ] Autentificare curieri (role-based: courier)
- [ ] Listă comenzi disponibile (status: ready)
- [ ] Acceptare comandă (update status: ready → delivering)
- [ ] Tracking GPS (opțional pentru MVP Beta - poate fi mock)
- [ ] Actualizare status livrare (delivering → delivered)
- [ ] Istoric comenzi livrate

**Criterii "Done":**
- ✅ Curierii pot accepta și livra comenzi
- ✅ Status-ul comenzii se actualizează în timp real

---

##### **BETA-P1: Features Avansate**

**BETA-P1-1: Integrare Plăți**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP complet  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Setup Stripe account și API keys
- [ ] Creare PaymentIntent în backend
- [ ] Integrare Stripe Checkout sau Elements în frontend
- [ ] Webhooks pentru confirmare plată
- [ ] Update status comandă după plată confirmată

**Criterii "Done":**
- ✅ Utilizatorii pot plăti comenzi cu card
- ✅ Plățile sunt procesate și confirmate
- ✅ Status-ul comenzii se actualizează după plată

---

**BETA-P1-2: Notificări**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP complet  
**Estimare:** 3-5 zile

**Task-uri:**
- [ ] Setup email service (SendGrid/Nodemailer)
- [ ] Template-uri email (confirmare comandă, status updates)
- [ ] Trigger notificări la evenimente (comandă plasată, status schimbat)
- [ ] Push notifications (opțional)

**Criterii "Done":**
- ✅ Utilizatorii primesc email la plasare comandă
- ✅ Utilizatorii primesc notificări la schimbare status

---

**BETA-P1-3: Performance și Scalabilitate**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP complet  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Setup Redis pentru caching
- [ ] Optimizare queries DB (indexes)
- [ ] CDN pentru assets statice
- [ ] Image optimization
- [ ] Code splitting în frontend

**Criterii "Done":**
- ✅ Aplicația se încarcă rapid (< 2s)
- ✅ Queries DB sunt optimizate
- ✅ Imagini sunt optimizate

---

**BETA-P1-4: Securitate**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP complet  
**Estimare:** 3-5 zile

**Task-uri:**
- [ ] Rate limiting (express-rate-limit)
- [ ] Input sanitization
- [ ] Security headers (helmet.js)
- [ ] Audit de securitate
- [ ] HTTPS/SSL

**Criterii "Done":**
- ✅ API este protejat împotriva atacurilor comune
- ✅ Rate limiting activ
- ✅ Security headers configurate

---

**BETA-P1-5: Testing**  
**Prioritate:** P1 🟡  
**Dependențe:** MVP complet  
**Estimare:** 1-2 săptămâni

**Task-uri:**
- [ ] Setup Jest/Vitest
- [ ] Unit tests pentru API endpoints critice
- [ ] Unit tests pentru componente React critice
- [ ] Integration tests pentru flow-uri (register → login → order)
- [ ] E2E tests cu Playwright/Cypress

**Criterii "Done":**
- ✅ Test coverage > 60% pentru cod critic
- ✅ Flow-urile principale sunt testate automat

---

### 📍 Etapa 3: Production
**Durată estimată:** 2-3 săptămâni  
**Status:** ⏳ Planificat  
**Focus:** Deploy, CI/CD, Monitoring, Launch

#### Obiectiv Production
Deploy în producție, lansare publică, și operare stabilă.

**Criterii de "Done" pentru Production:**
- ✅ Aplicația rulează stabil în producție
- ✅ SSL activat și configurat
- ✅ Backup automat pentru DB
- ✅ Monitoring și alerting activ
- ✅ CI/CD funcțional
- ✅ Documentație completă
- ✅ Launch public realizat

---

#### 🎯 Task-uri Production - Prioritizate

##### **PROD-P0: Infrastructură Producție**

**PROD-P0-1: Setup Server și Deploy**  
**Prioritate:** P0 🔴  
**Dependențe:** Beta complet  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Setup server producție (VPS/Cloud: AWS/DigitalOcean)
- [ ] Configurare Nginx reverse proxy
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configurare domain și DNS
- [ ] Deploy API și Storefront
- [ ] Setup environment variables producție

**Criterii "Done":**
- ✅ Aplicația este accesibilă public pe domain
- ✅ SSL funcționează (HTTPS)
- ✅ Toate serviciile rulează stabil

---

**PROD-P0-2: Backup și Monitoring**  
**Prioritate:** P0 🔴  
**Dependențe:** PROD-P0-1  
**Estimare:** 3-5 zile

**Task-uri:**
- [ ] Setup backup automat pentru PostgreSQL (daily)
- [ ] Setup monitoring (Prometheus/Grafana sau serviciu cloud)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Alerting pentru erori critice

**Criterii "Done":**
- ✅ Backup-uri automate funcționale
- ✅ Monitoring activ și alerting configurat
- ✅ Erorile sunt track-uite și raportate

---

##### **PROD-P1: CI/CD și Optimizări**

**PROD-P1-1: CI/CD Pipeline**  
**Prioritate:** P1 🟡  
**Dependențe:** PROD-P0-1  
**Estimare:** 3-5 zile

**Task-uri:**
- [ ] Setup GitHub Actions / GitLab CI
- [ ] Automated tests în pipeline
- [ ] Automated deployment (push to main → deploy)
- [ ] Rollback strategy
- [ ] Staging environment

**Criterii "Done":**
- ✅ Push la main declanșează deploy automat
- ✅ Testele rulează înainte de deploy
- ✅ Poți face rollback rapid

---

**PROD-P1-2: Documentație și Training**  
**Prioritate:** P1 🟡  
**Dependențe:** Beta complet  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Documentație API (Swagger/OpenAPI)
- [ ] Documentație deployment
- [ ] Ghid utilizator pentru clienți
- [ ] Training pentru admin și curieri
- [ ] Runbook pentru operațiuni

**Criterii "Done":**
- ✅ Documentația este completă și accesibilă
- ✅ Echipă știe cum să opereze aplicația

---

**PROD-P1-3: Launch**  
**Prioritate:** P1 🟡  
**Dependențe:** PROD-P0-1, PROD-P0-2  
**Estimare:** 1 săptămână

**Task-uri:**
- [ ] Testing final în producție
- [ ] Soft launch (beta testers)
- [ ] Fix bugs critice
- [ ] Public launch
- [ ] Marketing și promovare

**Criterii "Done":**
- ✅ Aplicația este live și funcțională
- ✅ Utilizatori pot folosi aplicația fără probleme majore

---

## 📊 Tracking Progres

### Progres General

| Etapă | Progres | Status |
|-------|---------|--------|
| **MVP** | ~15% | 🟡 În progres |
| **Beta** | 0% | ⏳ Planificat |
| **Production** | 0% | ⏳ Planificat |

### Detalii Progres MVP

| Categorie | Task-uri Complete | Task-uri Totale | Progres |
|-----------|-------------------|----------------|---------|
| **P0 - Critic** | 3 | 3 | 100% ✅ |
| **P1 - Important** | 0 | 5 | 0% |
| **P2 - Nice to Have** | 0 | 3 | 0% |
| **Total MVP** | 3 | 11 task-uri principale | 27% |

### Task-uri Complete MVP

#### P0 - Critic
- [x] MVP-P0-1: Setup Baza de Date și Schema ✅
- [x] MVP-P0-2: Autentificare Backend (Register/Login) ✅
- [x] MVP-P0-3: API Produse și Comenzi ✅

#### P1 - Important
- [ ] MVP-P1-1: State Management și API Client Frontend
- [ ] MVP-P1-2: Pagini Autentificare Frontend
- [ ] MVP-P1-3: Pagini Produse Frontend
- [ ] MVP-P1-4: Coș și Checkout Frontend
- [ ] MVP-P1-5: Pagini Comenzi Utilizator

#### P2 - Nice to Have
- [ ] MVP-P2-1: Pagină Profil Utilizator
- [ ] MVP-P2-2: UI/UX Polish
- [ ] MVP-P2-3: Docker Setup

---

## 📝 Note și Observații

### Decizii Tehnice
- **Baza de date:** PostgreSQL (recomandat pentru relații complexe și ACID compliance)
- **ORM:** Prisma (type-safe, migrations automate, excellent DX)
- **State Management:** Zustand (lightweight, simplu, performant)
- **API Client:** Axios (feature-rich, interceptors, good error handling)
- **Plăți:** Stripe (cel mai popular, bine documentat, suport pentru România)

### Priorități
1. **Critic:** Backend API complet funcțional
2. **Critic:** Autentificare și securitate
3. **Important:** Frontend complet cu toate paginile
4. **Important:** Coș și checkout funcțional
5. **Nice to have:** Admin panel și courier app (pot fi adăugate după MVP)

### Riscuri Identificate
- ⚠️ Integrarea plăților poate fi complexă (necesită cont Stripe și verificări)
- ⚠️ Tracking GPS pentru curieri necesită permisiuni și setup special
- ⚠️ Notificări în timp real necesită WebSockets sau polling

---

## 🎯 Focus MVP: Cele 3 Task-uri P0 Critice

Pentru a finaliza MVP-ul, următoarele **3 task-uri P0** sunt cele mai critice și trebuie implementate în această ordine exactă:

---

### **1. MVP-P0-1: Setup Baza de Date și Schema** 🔴
**Ordine:** #1 (Primul task)  
**Prioritate:** P0 - CRITIC  
**Dependențe:** Niciuna  
**Estimare:** 1-2 zile

**De ce este primul:**
- Toate celelalte task-uri depind de baza de date
- Fără DB, nu poți salva utilizatori, produse sau comenzi
- Este fundamentul întregii aplicații

**Ce trebuie făcut:**
1. Instalare PostgreSQL (local sau Docker)
2. Setup Prisma ORM în `services/api`
3. Creare schema cu toate modelele (User, Product, Category, Restaurant, Order, OrderItem)
4. Rulare migrations
5. Seed date de test (categorii, restaurante, produse)

**Criterii "Done":**
- ✅ Prisma configurat și conectat la PostgreSQL
- ✅ Toate modelele create și migrate-uite
- ✅ Date de test populate în DB
- ✅ Poți face query-uri de test din Prisma Studio

---

### **2. MVP-P0-2: Autentificare Backend (Register/Login)** 🔴
**Ordine:** #2 (Al doilea task)  
**Prioritate:** P0 - CRITIC  
**Dependențe:** MVP-P0-1 (necesită User model)  
**Estimare:** 1-2 zile

**De ce este al doilea:**
- După ce ai DB, ai nevoie de utilizatori
- Autentificarea este necesară pentru comenzile utilizatorilor
- Fără autentificare, nu poți proteja rutele și nu poți asocia comenzi cu utilizatori

**Ce trebuie făcut:**
1. Instalare dependențe: `jsonwebtoken`, `bcrypt`, `zod`
2. Implementare `POST /auth/register` (validare, hash password, creare user, returnare JWT)
3. Implementare `POST /auth/login` (validare credentials, returnare JWT)
4. Creare middleware `authenticateToken` pentru protecție rute
5. Implementare `GET /auth/me` (profil utilizator curent)

**Criterii "Done":**
- ✅ Poți înregistra un utilizator nou prin API
- ✅ Poți face login și primești JWT token
- ✅ Token-ul JWT funcționează pentru protecție rute
- ✅ `GET /auth/me` returnează utilizatorul autentificat
- ✅ Passwords sunt hash-uite (nu plain text în DB)

---

### **3. MVP-P0-3: API Produse și Comenzi** 🔴
**Ordine:** #3 (Al treilea task)  
**Prioritate:** P0 - CRITIC  
**Dependențe:** MVP-P0-1 (necesită modele Product, Order), MVP-P0-2 (pentru protecție rute)  
**Estimare:** 2-3 zile

**De ce este al treilea:**
- După ce ai DB și autentificare, poți implementa funcționalitatea principală
- Produsele și comenzile sunt core-ul aplicației de food delivery
- Fără acestea, aplicația nu are valoare pentru utilizatori

**Ce trebuie făcut:**

**Produse:**
1. Refactor `GET /products` (conectare la DB, înlocuire mock)
2. Implementare `GET /products/:id` (detalii produs)
3. Implementare `GET /categories` (listă categorii)
4. Implementare `GET /restaurants` (listă restaurante)

**Comenzi:**
1. Implementare `POST /orders` (protejat cu authenticateToken)
2. Implementare `GET /orders` (comenzile utilizatorului autentificat)
3. Implementare `GET /orders/:id` (detalii comandă)
4. Implementare `PUT /orders/:id/status` (pentru admin)

**Error Handling:**
1. Middleware error handling global
2. Validare input cu Zod pentru toate endpoint-urile

**Criterii "Done":**
- ✅ `GET /products` returnează produse din DB (nu mock)
- ✅ Poți filtra produse după categorie/restaurant
- ✅ `POST /orders` creează comandă în DB cu toate item-urile
- ✅ `GET /orders` returnează doar comenzile utilizatorului autentificat
- ✅ Toate erorile sunt returnate într-un format consistent
- ✅ Validarea input funcționează (test cu date invalide)

---

## 📋 Ordinea Exactă de Implementare pentru MVP

```
1. MVP-P0-1: Setup Baza de Date și Schema
   └─> 2. MVP-P0-2: Autentificare Backend
       └─> 3. MVP-P0-3: API Produse și Comenzi
           └─> 4. MVP-P1-1: State Management și API Client Frontend
               └─> 5. MVP-P1-2: Pagini Autentificare Frontend
                   └─> 6. MVP-P1-3: Pagini Produse Frontend
                       └─> 7. MVP-P1-4: Coș și Checkout Frontend
                           └─> 8. MVP-P1-5: Pagini Comenzi Utilizator
                               └─> 9. MVP-P2-1, P2-2, P2-3 (Nice to Have)
```

**Notă:** Task-urile P1 pot fi făcute în paralel după ce P0-3 este completat, dar ordinea de mai sus este optimă pentru a minimiza dependențele și a maximiza progresul.

---

## 🔄 Actualizări Roadmap

### 13 Februarie 2026
- ✅ Creare roadmap inițial
- ✅ Analiză structură proiect
- ✅ Identificare ce este implementat
- ✅ Planificare MVP detaliată cu prioritizare P0/P1/P2
- ✅ Identificare cele 3 task-uri P0 critice pentru MVP
- ✅ Definire ordine exactă de implementare
- ✅ **MVP-P0-1 COMPLETAT:** Setup Baza de Date și Schema
  - PostgreSQL configurat în Docker
  - Prisma 7.4.0 instalat și configurat
  - Schema completă cu 6 modele (User, Product, Category, Restaurant, Order, OrderItem)
  - Migrations rulate cu succes
  - Seed script creat și executat (7 categorii, 2 restaurante, 11 produse)
- ✅ **MVP-P0-2 COMPLETAT:** Autentificare Backend (Register/Login)
  - Dependențe instalate: jsonwebtoken, bcrypt, zod
  - POST /auth/register implementat (validare, hash password, creare user, returnare JWT)
  - POST /auth/login implementat (validare credentials, returnare JWT)
  - Middleware authenticateToken creat pentru protecție rute
  - GET /auth/me implementat (profil utilizator autentificat)
  - Validare input cu Zod pentru toate endpoint-urile
  - Error handling complet implementat
  - Testat și funcțional ✅
- ✅ **MVP-P0-3 COMPLETAT:** API Produse și Comenzi
  - GET /products implementat (filtrare, paginare, include category/restaurant)
  - GET /products/:id implementat (detalii produs)
  - GET /categories implementat (listă cu count produse)
  - GET /categories/:identifier implementat (detalii categorie)
  - GET /restaurants implementat (listă cu count produse)
  - GET /restaurants/:id implementat (detalii restaurant)
  - POST /orders implementat (creare comandă cu tranzacție, validare produse)
  - GET /orders implementat (comenzile utilizatorului, filtrare, paginare)
  - GET /orders/:id implementat (detalii comandă cu verificare permisiuni)
  - PUT /orders/:id/status implementat (actualizare status)
  - Validare input cu Zod pentru toate endpoint-urile
  - Error handling complet implementat
  - Toate endpoint-urile testate și funcționale ✅
- ✅ **MVP Orders end-to-end (storefront → API → DB):** 13 Feb 2026
  - **PostgreSQL:** docker-compose în `infra/docker/docker-compose.yml` (postgres:16-alpine, port 5432, DB `jester`). `DATABASE_URL` în `services/api/.env` (nu hardcodat în cod).
  - **Prisma:** Schema extinsă cu modele MVP: `CartOrder` (id, status, total, createdAt) și `CartOrderItem` (id, orderId, name, price, quantity). Migrare: `prisma/migrations/20260213190000_add_cart_orders`.
  - **API:** `POST /orders` body `{ items: [{ name, price, quantity }], total }` (Zod), creează CartOrder + CartOrderItems în tranzacție, returnează `{ orderId }`. `GET /orders` lista cu items, sortare desc după createdAt. `GET /orders/:id` o comandă cu items. Fără auth pentru MVP.
  - **Storefront:** La „Plasează comanda” din coș (Jester 24/24): POST /orders, la success golește coșul și redirect la `/orders`. Pagina `/orders` citește GET /orders, afișează status, total, dată, items; link la `/orders/[id]` pentru detaliu.
  - **Scripturi (root):** `npm run dev:db` (pornire PostgreSQL), `dev:api` (API), `dev:storefront` (Next.js). API: `npm run dev` în `services/api`.

**Cum pornești totul (MVP orders):**
1. Din root: `npm run dev:db` (sau `docker compose -f infra/docker/docker-compose.yml up -d`) – pornește PostgreSQL.
2. În `services/api`: asigură-te că `.env` conține `DATABASE_URL=postgresql://postgres:jester123@localhost:5432/jester?schema=public`, apoi `npx prisma migrate deploy` (dacă migrarea nu a fost rulată), `npm run dev`.
3. Din root: `npm run dev:storefront` (sau `npm run dev` în `apps/storefront`).
4. Deschide storefront, adaugă produse în coș pe `/jester-24-24`, apasă „Plasează comanda” → redirect la `/orders` unde vezi comanda.

---

**Notă:** Acest roadmap va fi actualizat automat de fiecare dată când finalizăm task-uri sau etape. Este sursa de adevăr pentru progresul proiectului Jester.
