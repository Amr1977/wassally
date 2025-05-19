/**
 * @file utils.js
 * @description Contains various utility functions.
 */

/**
 * Generates a random 4-digit pickup PIN.
 * @returns {string} A 4-digit PIN.
 */
export function generate_pickup_pin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}