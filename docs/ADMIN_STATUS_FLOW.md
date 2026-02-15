# Admin – logică status comenzi (design)

Document de design pentru flow-ul de modificare status din admin. Fără implementare în acest fișier – doar reguli clare înainte de cod.

---

## 1. Statusuri finale (nu mai pot fi modificate)

- **DELIVERED** – livrată
- **CANCELLED** / **CANCELED** – anulată

O comandă în unul din aceste statusuri **nu mai poate primi** schimbări de status din admin. Butoanele de schimbare nu trebuie afișate / trebuie dezactivate.

---

## 2. Statusuri modificabile manual (din admin)

| Status curent   | Tranziții permise (exemple)        |
|-----------------|------------------------------------|
| PENDING         | CONFIRMED, CANCELLED/CANCELED      |
| CONFIRMED       | PREPARING, ON_THE_WAY, CANCELLED/CANCELED |
| PREPARING       | ON_THE_WAY, READY, CANCELLED/CANCELED     |
| READY           | ON_THE_WAY, DELIVERED, CANCELLED/CANCELED |
| ON_THE_WAY / OUT_FOR_DELIVERY | DELIVERED, CANCELLED/CANCELED |

Regula: **doar înainte sau anulare**. Nu se permite trecerea „înapoi” din status final (ex: DELIVERED → PENDING).

---

## 3. Prevenirea schimbărilor greșite

- **Frontend:** afișezi butoane doar pentru tranzițiile permise. Ex: dacă status = DELIVERED, nu afișezi niciun buton de schimbare status.
- **Backend:** endpoint-ul `PATCH /orders/:id/status` trebuie să valideze tranziția (status curent → status nou). Dacă tranziția e invalidă (ex: DELIVERED → PENDING), răspuns **400** cu mesaj clar (ex: „Tranziție nepermisă”).
- **Listă de tranziții permise:** păstrată într-un singur loc (backend sau shared constant), ca să nu existe discrepanțe între UI și API.

---

## 4. Rezumat

| Întrebare                         | Răspuns |
|-----------------------------------|--------|
| Ce statusuri sunt finale?         | DELIVERED, CANCELLED, CANCELED. |
| Pot fi modificate manual?         | Da, doar comenzile care nu sunt în status final. |
| Cum prevenim DELIVERED → PENDING? | Backend refuză tranziția; frontend nu oferă buton pentru astfel de schimbare. |

Următorul pas: implementare în backend (validare tranziții) și în admin UI (butoane doar pentru tranziții permise), fără refactor masiv.
