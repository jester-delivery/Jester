const { EventEmitter } = require('events');

/**
 * EventEmitter pentru status updates comenzi.
 * Când admin face PATCH /orders/:id/status, emitem 'order:status' cu { orderId, order }.
 * SSE handler-ul se subscribe pentru orderId specific.
 */
const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(100);

/**
 * @param {object} order - Comanda (cu items dacă e cazul)
 * @param {{ reason?: string }} [opts] - reason: 'courier_refused' când curierul refuză (clientul primește notificare)
 */
function emitOrderStatus(order, opts = {}) {
  orderEvents.emit('order:status', {
    orderId: order.id,
    status: order.status,
    order,
    reason: opts.reason,
  });
}

/**
 * Emis când o comandă nouă este creată (PENDING, disponibilă pentru curieri).
 * Curierii conectați la SSE /courier/orders/available/stream primesc evenimentul instant.
 */
function emitNewOrderAvailable(order) {
  orderEvents.emit('courier:new_available', { order });
}

module.exports = { orderEvents, emitOrderStatus, emitNewOrderAvailable };
