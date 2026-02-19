# Verificare proiect – duplicate, dead code, consistență

**Data:** 13 februarie 2026  
**Scop:** Fără fișiere duplicate, fără cod mort care poate crea bug-uri; totul curat și coerent.

---

## Ce s-a verificat

### 1. Fișiere duplicate
- **Un singur `api.ts`:** `apps/storefront/lib/api.ts` – OK.
- **Rute API:** Un singur fișier per rută (auth, products, categories, admin, orders, cartOrders, courier, etc.) – OK.
- **Pagini:** Fiecare rută are o singură `page.tsx` – OK.

### 2. Date statice vs API
- **Paginile de categorii (pizza, bake, grill, supply, antiq):** Folosesc `useCategory(slug)` → `api.categories.getById(slug)` – date din API. OK.
- **Jester 24/24:** Folosește `JESTER24_CATEGORIES` din `lib/data/jester24-products.ts` – intenționat (catalog special cu subcategorii Snacks, Băuturi etc.). OK.
- **BubbleHub:** Citește `api.categories.getAll({ activeOnly: "1" })` – doar categorii active din API. OK.

### 3. Configurații
- **delivery.ts** (storefront) vs **delivery.js** (API): nu sunt duplicate – unul e pentru frontend (taxe afișate), celălalt pentru backend (calcule). OK.

### 4. Porturi (nu pornește pe 3000)
- **Storefront (Next.js):** `apps/storefront/package.json` → script `"dev": "next dev -p 3001"` – **explicit port 3001**, deci nu folosește niciodată 3000 (evită conflict cu alte app-uri Next pe 3000).
- **API (Express):** `services/api/index.js` → `PORT = process.env.PORT || 4000` – pornește pe **4000** (sau ce e în `.env`).
- **Postgres:** `infra/docker/docker-compose.yml` → `5432:5432`.
- **stack.sh:** pornește API și storefront în background; verifică health pe `localhost:4000` și `localhost:3001`; la stop face `fuser -k 4000/tcp 3001/tcp`.

**Rezumat:** Jester folosește **3001** (web) și **4000** (API). **Nimic nu pornește pe 3000.**

---

## Modificări făcute (curățenie)

### 1. Fișiere șterse (cod mort)
Erau **5 fișiere** de produse statice **nefolosite** (niciun import în proiect). Paginile respectivelor categorii folosesc de mult `useCategory` din API.

- ~~`apps/storefront/lib/data/pizza-products.ts`~~
- ~~`apps/storefront/lib/data/supply-products.ts`~~
- ~~`apps/storefront/lib/data/grill-products.ts`~~
- ~~`apps/storefront/lib/data/bake-products.ts`~~
- ~~`apps/storefront/lib/data/antiq-products.ts`~~

**Păstrat:** `lib/data/jester24-products.ts` – folosit de `app/jester-24-24/page.tsx`.

### 2. Consistență admin
- **Admin Products** – dropdown „Categorie”: înainte folosea `api.categories.getAll()` (endpoint public). Acum folosește `api.admin.getCategories()` (endpoint admin), ca restul paginilor admin.

### 3. Erori TypeScript remediate (build)
- **courier/orders/[id]/page.tsx** – cast pentru `refusedReason`: folosit același tip opțional `{ refusedReason?: string | null }` în ambele locuri, ca să nu ceară proprietate obligatorie.
- **courier/page.tsx** – tipul `onRefuse` în OrderCard: schimbat din `(id: string) => void` în `(id: string, reason?: string) => void` ca să corespundă cu `handleRefuse(id, reason?)`.
- **BottomNavigation.tsx** – `items` tipat explicit ca `NavItem[]` ca să accepte elemente fără `resolveHref` (ex. tab Curier).

---

## Ce nu s-a șters (intenționat)

- **jester24-products.ts** – folosit pentru catalogul Jester 24/24 (subcategorii + produse statice).
- **Seed-ul** din `services/api/prisma/seed.js` – comentariul care menționează „jester24-products.ts” a rămas (referă la alinierea produselor din DB cu catalogul Jester 24/24); nu e legat de fișierele șterse.

---

## Rezumat

- **Fără duplicate** de rute, pagini sau API client.
- **Fără cod mort** – eliminate cele 5 fișiere de produse statice nefolosite.
- **Consistență** – admin products folosește API-ul admin pentru listă de categorii.
- **Build:** `npm run build` în storefront trece (TypeScript OK).
- **Fișiere șterse:** Doar cele 5 de produse statice nefolosite; **nu** s-a șters jester24-products.ts nici alt cod folosit.

Dacă ceva nu funcționează după curățenie (ex. o pagină de categorie), spune care – putem restabili fișierele șterse din git sau recrea stuburi. Paginile pizza, bake, grill, supply, antiq folosesc toate `useCategory(slug)` din API, deci nu depind de fișierele șterse.
