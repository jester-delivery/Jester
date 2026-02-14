const { EventEmitter } = require('events');

/**
 * EventEmitter pentru status updates comenzi.
 * Când admin face PATCH /orders/:id/status, emitem 'order:status' cu { orderId, order }.
 * SSE handler-ul se subscribe pentru orderId specific.
 */
const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(100);

function emitOrderStatus(order) {
  orderEvents.emit('order:status', {
    orderId: order.id,
    status: order.status,
    order,
  });
}

module.exports = { orderEvents, emitOrderStatus };
