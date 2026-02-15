# Dashboard Admin – Cum intri

Panoul de comenzi (admin) este o pagină din aplicația storefront Next.js, **nu** AdminJS sau alt dashboard separat.

---

## 1. URL și port

| Ce | Unde |
|----|------|
| **Storefront (UI)** | Același domeniu/port ca restul site-ului. Exemplu: `https://jester.delivery` sau `http://<IP>:3000`. |
| **Ruta dashboard** | **`/jester-24-24/admin`** (path fix în Next.js). |
| **URL complet** | `https://jester.delivery/jester-24-24/admin` sau `http://<IP>:3000/jester-24-24/admin`. |
| **API** | Setat în storefront prin `NEXT_PUBLIC_API_URL` (ex: `https://api.jester.delivery` sau `http://<IP>:4000`). API-ul rulează pe portul din `.env` (implicit **4000**). |

Nu există port sau URL separat pentru „dashboard” – e doar o rută a storefront-ului.

---

## 2. User / parolă

- **Autentificare:** același login ca pentru clienți (Register/Login pe site).
- **Cine are acces admin:** doar utilizatorii al căror **email** este în lista **ADMIN_EMAILS** din mediul de rulare al **API-ului**.

### Unde se setează

- **API:** fișierul `.env` din `services/api/` (sau variabile de mediu pe VPS/Docker).

Exemplu în `services/api/.env`:

```env
ADMIN_EMAILS=admin@jester.ro,dex@mail.com
```

- Mai multe emailuri: separate prin virgulă. Spațiile sunt eliminate; comparația e case-insensitive.
- **Parola** pentru aceste conturi e cea setată la înregistrare (sau la reset parolă, dacă există flow). Nu există un user/parolă specială doar pentru admin – folosești un cont obișnuit al cărui email e în `ADMIN_EMAILS`.

---

## 3. Flow

1. Crezi/folosești un cont cu email inclus în `ADMIN_EMAILS`.
2. Te loghezi pe site (pagina de Login).
3. Mergi la **`/jester-24-24/admin`** (introduci URL-ul direct sau pui un link în app).
4. Dacă nu ești admin (email nu e în listă), primești redirect (ex: la `/` sau la login).
5. Pe dashboard vezi lista de comenzi (cart orders), ETA, note interne și butoane pentru status: Confirm, Preparing, On the way, Delivered, Cancel.

---

## 4. Rezumat

| Întrebare | Răspuns |
|-----------|---------|
| URL dashboard | `https://<domeniu-storefront>/jester-24-24/admin` (același host/port ca site-ul). |
| Port „dashboard” | Același port ca storefront-ul (ex: 3000). |
| User / parolă | Cont obișnuit; emailul trebuie să fie în `ADMIN_EMAILS` (în `.env` la API). |
| Unde se setează admin | `ADMIN_EMAILS` în `services/api/.env` (sau env pe server). |
