# Issue: Dependency upgrade (npm audit – fără --force)

**Context:** După `npm audit fix` (fără `--force`) a rămas **1 high** și mai multe moderate în `services/api`. Nu s-a folosit `npm audit fix --force` ca să nu introducem breaking changes acum.

---

## Rămas de rezolvat (services/api)

| Severity | Pachet | Notă |
|----------|--------|------|
| **high** | nodemailer <=7.0.10 | Fix: upgrade la nodemailer@8.x (breaking change). Advisories: GHSA-mm7p-fcc7-pg87, GHSA-rcmh-qjqh-p98v. |
| moderate | hono (via prisma/@prisma/dev) | Fix disponibil doar cu --force (prisma downgrade). |
| moderate | lodash (via chevrotain → prisma-ast) | Fix disponibil doar cu --force. |
| moderate | qs 6.7.0–6.14.1 | DoS; `npm audit fix` poate rezolva fără --force – verifică din nou. |

---

## Acțiuni recomandate (când e cazul)

1. **nodemailer:** planifică upgrade la 8.x; verifică changelog și adaptează codul (emailService.js) dacă API-ul s-a schimbat.
2. **Prisma/hono/lodash:** urmărește actualizări Prisma care să folosească dependențe fără vulnerabilități; evita `--force` până la un release stabil.
3. Rulează periodic `npm audit` și `npm audit fix` (fără --force); documentează orice high care rămâne până la rezolvare.

---

**Nu forța breaking changes acum** – tratat ca task separat de „dep upgrade”.
