# La somn – rezumat zilnic

Scop: când mergi la culcare, ai aici un rezumat scurt cu ce s-a făcut azi și ce e gata.

---

## 2026-02-13 (înainte de culcare)

**Ce am făcut azi**

- **TASK 5 – Admin Products Manager (MVP)**  
  Listă produse cu: căutare după nume, filtre (categorie, Vizibil ON/OFF, Disponibil), sortare după sortOrder apoi nume. Edit produs: nume, descriere, preț, imagine, categorie, isActive, isAvailable, **sortOrder**. Quick toggles în listă (isActive, isAvailable) fără să intri în edit. Validare: preț > 0, nume obligatoriu. După modificare, la refresh pe client se văd imediat datele.

- **TASK 6 – Categories Manager & BubbleHub din API**  
  Categorii în admin: listă (slug, titlu, ON/OFF, sortOrder, nr produse), edit (titlu, descriere, icon, isActive, sortOrder), quick toggle isActive. Schema Category: description, isActive, sortOrder. **BubbleHub** citește din API doar categoriile active (`GET /categories?activeOnly=1`), sortate; dacă o categorie e OFF în admin, dispare din hub; la refresh clientul vede ordinea din admin.

**Unde e scris**

- **CHANGELOG.md** – intrare [2026-02-13] Admin Products Manager & Categories Manager (TASK 5 & 6), cu detaliu API + UI.
- **PROJECT_ROADMAP.md** – DONE actualizat cu Products Manager, Categories Manager, BubbleHub din API.
- **README.md** – secțiunea Admin și Categorii/produse din API, plus tabel API cu admin products/categories.

**Ce e gata**

- Admin: listă produse (search, filtre, sortOrder), edit produs (inclusiv sortOrder), quick toggles.
- Admin: listă categorii, edit categorie (titlu, descriere, icon, isActive, sortOrder), quick toggle isActive.
- Client: BubbleHub afișează doar categoriile active din API, sortate; modificările din admin se văd la refresh.

**Mâine / ulterior (idei)**

- Polish UI, notificări, deploy.

---

*Actualizat: 13 feb 2026, înainte de culcare.*
