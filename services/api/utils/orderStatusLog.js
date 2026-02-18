const prisma = require('./prisma');

/**
 * Salvează un log la fiecare schimbare de status pentru CartOrder.
 * Apelat după orice update de status (courier accept/status, admin, etc.).
 * @param {string} orderId - ID comanda (CartOrder)
 * @param {string} previousStatus - status înainte
 * @param {string} newStatus - status după
 * @param {string|null} changedByUserId - user care a făcut schimbarea (null = sistem)
 */
async function logOrderStatusChange(orderId, previousStatus, newStatus, changedByUserId = null) {
  try {
    await prisma.orderStatusLog.create({
      data: {
        orderId,
        previousStatus: String(previousStatus),
        newStatus: String(newStatus),
        changedByUserId: changedByUserId || null,
      },
    });
  } catch (err) {
    console.error('[OrderStatusLog]', err);
  }
}

module.exports = { logOrderStatusChange };
