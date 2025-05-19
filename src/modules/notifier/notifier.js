/**
 * @file notifier.js
 * @description Sends notifications.
 */

/**
 * Sends a notification to a courier.
 * @param {Object} courier
 * @param {string} message
 */
export function notify_courier(courier, message) {
  console.log("Notifying courier:", courier, "with message:", message);
}

/**
 * Sends a notification to a customer.
 * @param {Object} customer
 * @param {string} message
 */
export function notify_customer(customer, message) {
  console.log("Notifying customer:", customer, "with message:", message);
}