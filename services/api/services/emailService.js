const nodemailer = require('nodemailer');
require('dotenv').config();

const ETA_MINUTES = 30;
const SUBJECT = 'Comanda ta a intrat în joc 🎭 – Jester o pregătește!';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
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

function isSmtpConfigured() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return !!(host && user && pass);
}

function formatDateRO(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTotal(total) {
  return Number(total).toFixed(2);
}

function formatPaymentMethod(pm) {
  if (pm === 'CASH_ON_DELIVERY') return 'Plată la livrare';
  if (pm === 'CARD') return 'Plată cu cardul';
  return pm || 'Plată la livrare';
}

/**
 * Construiește conținutul emailului de confirmare comandă.
 * @param {{ to: string, name: string, order: object }} opts
 * @param {string} opts.to - Email destinatar
 * @param {string} opts.name - Nume client
 * @param {object} opts.order - Comandă (id, createdAt, deliveryAddress, phone, paymentMethod, items[], total)
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildOrderConfirmationContent({ name, order }) {
  // În email afișăm prefix (8 caractere) pentru lizibilitate; API/DB folosesc id complet
  const orderId = (order.id || '').slice(0, 8);
  const createdAt = formatDateRO(order.createdAt);
  const deliveryAddress = order.deliveryAddress || '–';
  const phone = order.phone || '–';
  const paymentMethod = formatPaymentMethod(order.paymentMethod);
  const total = formatTotal(order.total);
  const etaMinutes = order.etaMinutes != null ? order.etaMinutes : ETA_MINUTES;

  const items = (order.items || []).map((item) => ({
    name: String(item.name),
    quantity: Number(item.quantity) || 1,
    price: formatTotal(Number(item.price) || 0),
  }));

  const itemsLinesHtml = items
    .map((i) => `<li><strong>${escapeHtml(i.name)}</strong> × ${i.quantity} — ${i.price} lei</li>`)
    .join('\n');
  const itemsLinesText = items
    .map((i) => `* ${i.name} × ${i.quantity} — ${i.price} lei`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px;">
  <p>🎭 Salut, ${escapeHtml(name || 'client')}!</p>
  <p>Jester a primit comanda ta și a intrat direct în bucătărie.<br>Nu e glumă. E foc real. 🔥</p>

  <h3 style="margin-top: 1.5em;">🧾 Detalii comandă</h3>
  <ul style="list-style: none; padding: 0;">
    <li><strong>Număr comandă:</strong> #${escapeHtml(orderId)}</li>
    <li><strong>Data:</strong> ${escapeHtml(createdAt)}</li>
    <li><strong>Adresă livrare:</strong> ${escapeHtml(deliveryAddress)}</li>
    <li><strong>Telefon:</strong> ${escapeHtml(phone)}</li>
    <li><strong>Modalitate plată:</strong> ${escapeHtml(paymentMethod)}</li>
  </ul>

  <h3 style="margin-top: 1.5em;">🍕 Ce ai comandat:</h3>
  <ul>
    ${itemsLinesHtml}
  </ul>

  <p><strong>💰 Total: ${total} lei</strong></p>

  <h3 style="margin-top: 1.5em;">🚚 ETA livrare</h3>
  <p>Livratorul pornește în aproximativ: <strong>${etaMinutes} minute</strong>.</p>
  <p style="color: #666; font-size: 0.9em;">Dacă se întâmplă ceva neprevăzut (trafic, ninsoare, pisici pe drum), te contactăm imediat.</p>
</body>
</html>`;

  const text = `🎭 Salut, ${name || 'client'}!

Jester a primit comanda ta și a intrat direct în bucătărie.
Nu e glumă. E foc real. 🔥

🧾 Detalii comandă
Număr comandă: #${orderId}
Data: ${createdAt}
Adresă livrare: ${deliveryAddress}
Telefon: ${phone}
Modalitate plată: ${paymentMethod}

🍕 Ce ai comandat:
${itemsLinesText}

💰 Total: ${total} lei

🚚 ETA livrare
Livratorul pornește în aproximativ: ${etaMinutes} minute.

Dacă se întâmplă ceva neprevăzut, te contactăm imediat.`;

  return { subject: SUBJECT, html, text };
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Trimite email de confirmare comandă.
 * Nu aruncă dacă SMTP nu e configurat (doar nu trimite). Loghează doar: sent / failed / skipped.
 * @param {{ to: string, name: string, order: object }} opts
 * @returns {Promise<void>}
 */
async function sendOrderConfirmationEmail({ to, name, order }) {
  const orderIdShort = (order?.id || '').slice(0, 8);
  const trans = getTransporter();
  if (!trans) {
    console.log('[email] skipped (SMTP not configured)');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jester.delivery';
  const { subject, html, text } = buildOrderConfirmationContent({
    name,
    order: {
      ...order,
      etaMinutes: order.estimatedDeliveryMinutes != null ? order.estimatedDeliveryMinutes : ETA_MINUTES,
      items: (order.items || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    },
  });

  try {
    await trans.sendMail({
      from: `"Jester" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('[email] sent orderId=' + orderIdShort + ' to=' + to);
  } catch (err) {
    console.log('[email] failed orderId=' + orderIdShort + ' err=' + (err?.message || String(err)));
    throw err;
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  buildOrderConfirmationContent,
  isSmtpConfigured,
  ETA_MINUTES,
};
