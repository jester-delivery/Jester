/**
 * Test conținut email confirmare comandă (fără SMTP).
 * Rulează: node scripts/test-order-email-content.js
 * Verifică: dată RO, total 2 zecimale, items mapate, paymentMethod RO.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { buildOrderConfirmationContent } = require('../services/emailService');

const mockOrder = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  createdAt: new Date('2026-02-13T21:30:00.000Z'),
  deliveryAddress: 'Str. Exemplu nr. 1, București',
  phone: '0722123456',
  paymentMethod: 'CASH_ON_DELIVERY',
  items: [
    { name: 'Pizza Margherita', quantity: 2, price: 45 },
    { name: 'Cola', quantity: 1, price: 8 },
  ],
  total: 98,
};

const { subject, text, html } = buildOrderConfirmationContent({
  name: 'Alex',
  order: mockOrder,
});

console.log('--- SUBJECT ---');
console.log(subject);
console.log('\n--- TEXT (excerpt) ---');
console.log(text.slice(0, 600) + '...');
console.log('\n--- Checks ---');
console.log('Date RO:', text.includes('februarie') || text.includes('Februarie') ? 'OK' : 'MISSING');
console.log('Total 2 decimals:', text.includes('98.00') ? 'OK' : 'MISSING');
console.log('Items mapped:', text.includes('Pizza Margherita') && text.includes('45.00') ? 'OK' : 'MISSING');
console.log('ETA 30 min:', text.includes('30 minute') ? 'OK' : 'MISSING');
console.log('Plată la livrare:', text.includes('Plată la livrare') ? 'OK' : 'MISSING');
console.log('orderId prefix #:', text.includes('#a1b2c3d4') ? 'OK' : 'MISSING');
