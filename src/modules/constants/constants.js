/**
 * @fileoverview Contains system-wide constants in SCREAMING_SNAKE_CASE.
 */

/**
 * Earth's radius in kilometers, used for distance calculations.
 * @constant {number}
 */
export const R = 6371;

/**
 * Your external API key (e.g., for Google Maps).
 * @constant {string}
 */
export const API_KEY = 'your_google_maps_api_key';

/**
 * Fallback average speed (in m/s) for route duration estimates.
 * @constant {number}
 */
export const AVERAGE_SPEED = 1.4;

/**
 * System commission rate applied to platform fees.
 * @constant {number}
 */
export const SYSTEM_COMMISSION_RATE = 0.10;

/**
 * Timeout threshold for waiting (in milliseconds).
 * @constant {number}
 */
export const WAITING_TIMEOUT = 300000; // 5 minutes

/**
 * Wallet balance threshold (if below, only wallet orders are shown).
 * @constant {number}
 */
export const CASH_BLOCK = -100;