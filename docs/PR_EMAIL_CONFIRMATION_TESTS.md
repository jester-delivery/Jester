# Test scenarii – Email confirmare comandă (pentru PR description)

Rulează cele 3 scenarii local, apoi copiază rezultatul în PR description.

---

## A. SMTP setat (happy path)

**Setup:** `.env` cu `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (și opțional `SMTP_FROM`) valide.

**Pași:**
1. Pornește API: `cd services/api && node index.js`
2. În UI (storefront): fii logat, adaugă produse în coș, mergi la checkout, completează și apasă „Plasează comanda”

**Rezultat așteptat:**
- API răspunde **201** + `orderId`
- În logs API: **fără spam** (doar eventual confirmare trimitere email)
- **Email primit** cu: items, total (2 zecimale), ETA 30 min, adresă, telefon, modalitate plată (Plată la livrare / Plată cu cardul)

**Rezultat (completează după test):**
```
[ ] 201 + orderId
[ ] Email primit
[ ] Conținut: items, total, ETA, address, paymentMethod
```

---

## B. SMTP lipsă (safety path)

**Setup:** Șterge sau golește din `.env`: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (sau redenumește temporar `.env`)

**Pași:**
1. Pornește API
2. Plasează o comandă din UI (ca la A)

**Rezultat așteptat:**
- API răspunde **201** + `orderId` (flow-ul nu crapă)
- **Nu** se trimite email
- **Nu** apare eroare în log pentru email (getTransporter() returnează null, sendOrderConfirmationEmail iese lin)

**Rezultat (completează după test):**
```
[ ] 201 + orderId
[ ] Nu s-a trimis email
[ ] Fără eroare în log
```

---

## C. SMTP greșit (failure path)

**Setup:** Pune în `.env` credențiale SMTP **greșite** (ex: `SMTP_USER=wrong`, `SMTP_PASS=wrong`)

**Pași:**
1. Pornește API
2. Plasează o comandă din UI

**Rezultat așteptat:**
- API răspunde **201** + `orderId` (comanda e creată, răspunsul nu e blocat)
- În log API apare **o singură linie**: `[cart-orders] Order confirmation email failed: <mesaj>`

**Rezultat (completează după test):**
```
[ ] 201 + orderId
[ ] Log: [cart-orders] Order confirmation email failed: ...
```

---

## Test conținut (fără SMTP)

Pentru a verifica doar formatul emailului (dată RO, total, items, paymentMethod):

```bash
cd services/api && node scripts/test-order-email-content.js
```

Verifică că toate liniile „Checks” sunt OK.
