/**
 * @fileoverview Contains system-wide constants in SCREAMING_SNAKE_CASE.
 */

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