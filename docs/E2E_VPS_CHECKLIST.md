# Checklist E2E pe VPS (inainte de livrare client)

Confirmare end-to-end: **register → login → checkout → place order → orders list → order details**.

---

## 1. Ce verifici

### Flow complet
1. **Register** – cont nou (email, parola, nume). Raspuns 201 + token + user.
2. **Login** – autentificare. Raspuns 200 + token + user. **userId vine din JWT** (nu hardcodat).
3. **Checkout** – cos cu produse, formular (adresa, telefon, nume), Plaseaza comanda.
4. **Place order** – POST /cart-orders cu JWT. Raspuns **201** mereu + **orderId**. UI nu arata eroare; toast + redirect la /orders.
5. **Orders list** – GET /orders/my. Lista comenzilor user-ului; fiecare cu #orderId scurt (8 caractere) + status + total.
6. **Order details** – GET /orders/:id. Pagina unei comenzi: status, timeline, ETA, items, total.

### Tehnic
- **userId din JWT:** la POST /cart-orders, req.userId vine din authenticateToken (decode JWT). Nu exista userId în body.
- **201 + orderId:** raspunsul la create order este mereu { success: true, orderId: "<uuid>" } cu status 201.
- **Health:** GET /health → { ok: true, smtpConfigured: true|false }.

---

## 2. Pasi pe VPS

1. Deploy API + storefront (vezi docs/DEPLOY_VPS.md).
2. Deschide storefront-ul în browser.
3. Inregistreaza un cont nou, apoi login.
4. Mergi la Jester 24/24, adauga produse, Checkout, completeaza formularul, Plaseaza comanda.
5. Verifica: toast "Comanda plasata cu succes", redirect la /orders; în lista apare comanda cu #id scurt.
6. Click pe comanda → pagina de detaliu: status, timeline, ETA, items.
7. (Optional) Admin: login cu email din ADMIN_EMAILS → /jester-24-24/admin → schimba statusul → pe detaliu/listă apare update.

---

## 3. Daca ceva nu merge

- Eroare la place order: verifica log API [POST /cart-orders]. Daca 201 dar fara email: verifica [email] sent/failed/skipped si /health smtpConfigured.
- userId invalid: asigura-te ca token-ul e trimis (Authorization Bearer) si ca nu se foloseste userId din body.
- Orders list goala: GET /orders/my foloseste acelasi JWT; verifica ca comanda are userId setat la create.
