# Deploy pe VPS – pași după `git pull`

După ce tragi ultimele modificări din GitHub pe VPS, urmează pașii de mai jos.

---

## 1. Pull pe VPS

```bash
cd /path/to/jester   # unde ai clonat repo-ul
git pull origin main
```

---

## 2. API (dacă rulează în Docker sau direct)

### Variabile de mediu

Copiază schema și completează (vezi `services/api/.env.example`):

```bash
cd services/api
cp .env.example .env
# Editează .env: DATABASE_URL, JWT_SECRET, ADMIN_EMAILS
```

În Docker, `DATABASE_URL` trebuie să folosească numele serviciului Postgres:

```env
DATABASE_URL=postgresql://postgres:PAROLA_TA@postgres:5432/jester
```

### Migrări Prisma (la prima deploy sau după migrări noi)

```bash
cd services/api
npm install
npx prisma migrate deploy
npx prisma generate
```

### Pornire

- **Docker:** `docker compose -f infra/docker/docker-compose.yml up -d --build`
- **Direct:** `node index.js` (sau cu pm2)

---

## 3. Storefront (Next.js)

### Variabilă obligatorie

Storefront-ul folosește `NEXT_PUBLIC_API_URL` **la build**. Setează-o **înainte** de `npm run build`.

Pe server (sau în `.env.production` / variabile de mediu la build):

```env
NEXT_PUBLIC_API_URL=https://api.jester.delivery
```

Înlocuiește cu URL-ul real al API-ului (https dacă site-ul e pe https).

### Build și start

```bash
cd apps/storefront
npm install
npm run build
npm run start
```

Sau repornești containerul Docker dacă storefront e containerizat.

**Important:** La fiecare schimbare a `NEXT_PUBLIC_API_URL` trebuie făcut **rebuild** (`npm run build`) și repornit aplicația.

---

## 4. Rezumat

| Unde        | Ce faci |
|------------|---------|
| VPS        | `git pull origin main` |
| API        | `.env` corect, `prisma migrate deploy`, (re)pornești API-ul |
| Storefront | Setezi `NEXT_PUBLIC_API_URL`, `npm run build`, `npm run start` (sau restart container) |

Dacă login dă eroare, vezi `docs/LOGIN_TROUBLESHOOTING.md`.
