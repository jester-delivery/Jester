# Login – troubleshooting (production)

Checklist și soluții când login-ul dă eroare pe www.jester.delivery.

---

## 1. Ce verifici în browser (F12)

### Network tab

1. Deschide **F12 → Network**. Apasă Login pe site.
2. Caută requestul către API:
   - **URL așteptat:** `https://api.jester.delivery/auth/login` (sau domeniul tău de API).
   - Dacă vezi `http://localhost:4000/auth/login` → storefront-ul a fost buildat cu `NEXT_PUBLIC_API_URL` greșit sau lipsă.

| Ce vezi | Cauză probabilă | Soluție |
|--------|------------------|--------|
| Request la **localhost:4000** | API URL e din build-ul vechi | Rebuild storefront cu `NEXT_PUBLIC_API_URL` corect (vezi mai jos). |
| Request **failed** / **CORS** (roșu) | API nu răspunde sau blochează origin | Verifică API live, CORS pe server, reverse proxy. |
| **404** pe `/auth/login` | Ruta nu există sau proxy greșit | Verifică că API-ul e montat corect și ruta e `/auth/login`. |
| **502 / 503** | API down sau proxy greșit | Verifică containerele API, nginx/Caddy, firewall. |
| **500** | Eroare în API (DB, JWT, etc.) | Verifică logurile API (vezi secțiunea 3). |

### Console tab

- Erori roșii legate de **CORS** → API trebuie să permită origin-ul `https://www.jester.delivery` (sau domeniul storefront-ului).
- Erori de **network** / **Failed to fetch** → API inaccesibil (URL greșit, firewall, SSL).

---

## 2. Variabile de mediu („schemă”)

### Storefront (Next.js)

- `NEXT_PUBLIC_API_URL` se pune **la build time**. Dacă schimbi valoarea, trebuie **rebuild** (`npm run build`) și redeploy.
- Pe production: `NEXT_PUBLIC_API_URL=https://api.jester.delivery` (sau domeniul tău de API, cu **https**).

Exemplu `.env.production` (sau ce folosești pe server):

```env
NEXT_PUBLIC_API_URL=https://api.jester.delivery
```

După modificare:

```bash
cd apps/storefront
npm run build
npm run start
# sau repornești containerul Docker
```

### API (Express)

- Vezi `services/api/.env.example` pentru lista completă.
- Pe production obligatoriu: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`.
- În Docker, host pentru Postgres e numele serviciului: `postgres` (nu `localhost`).

---

## 3. Verificat pe server (API)

### Loguri API

Dacă requestul ajunge la API dar primești 500 sau nu primești răspuns:

```bash
# Docker
docker compose -f infra/docker/docker-compose.yml logs -f api

# sau dacă rulezi direct
cd services/api && node index.js
# și reproduci login-ul – eroarea apare în terminal
```

Erori frecvente:

- **DATABASE_URL** lipsă sau greșită → „connection refused” / Prisma errors.
- **JWT_SECRET** lipsă → unele versiuni pot să crape la `jwt.sign`.
- **Prisma** – migrări nerulate: `npx prisma migrate deploy`.

### CORS

API-ul folosește `cors()` fără opțiuni → acceptă orice origin. Dacă ai setat restricții pe reverse proxy sau pe CORS, asigură-te că origin-ul storefront-ului (ex: `https://www.jester.delivery`) e permis.

### HTTPS

- Storefront pe **https**, API pe **http** → browserul poate bloca (mixed content). API-ul trebuie servit tot pe **https** (prin nginx/Caddy sau tunnel).

---

## 4. Rezumat pași

1. **Browser:** F12 → Network → unde merge requestul la login? (URL + status code).
2. **Dacă URL e localhost:** rebuild storefront cu `NEXT_PUBLIC_API_URL` corect + redeploy.
3. **Dacă CORS / failed:** verifică API live, CORS, reverse proxy, firewall.
4. **Dacă 500:** verifică loguri API, `DATABASE_URL`, `JWT_SECRET`, `prisma migrate deploy`.

După ce ai făcut pașii de mai sus, poți reveni cu mesajul exact de eroare (din UI) și status code + URL din Network, și putem narrow-down la cauza precisă.
