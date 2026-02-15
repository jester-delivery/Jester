const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@jester.delivery';

  if (!host || !user || !pass) {
    console.warn('[mail] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Trimite email de confirmare cont după înregistrare.
 * Dacă SMTP nu e configurat, doar loghează și nu aruncă eroare.
 */
async function sendWelcomeEmail(toEmail, userName) {
  const trans = getTransporter();
  if (!trans) {
    console.log('[mail] Skip welcome email (no SMTP):', toEmail);
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@jester.delivery';
  const subject = 'Cont creat cu succes – Jester';
  const text = `Bună ${userName || 'utilizator'},

Contul tău Jester a fost creat cu succes.

Poți folosi aplicația pentru a plasa comenzi.

Echipa Jester`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
  <p>Bună ${userName ? escapeHtml(userName) : 'utilizator'},</p>
  <p>Contul tău Jester a fost creat cu succes.</p>
  <p>Poți folosi aplicația pentru a plasa comenzi.</p>
  <p>Echipa Jester</p>
</body>
</html>`;

  try {
    await trans.sendMail({
      from: `"Jester" <${from}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log('[mail] Welcome email sent to:', toEmail);
  } catch (err) {
    console.error('[mail] Failed to send welcome email:', err.message);
    throw err;
  }
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendWelcomeEmail, getTransporter };
