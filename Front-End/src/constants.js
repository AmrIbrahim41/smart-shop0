/**
 * constants.js — Static fallback values for store calculation constants.
 *
 * These are used ONLY as safe defaults when the API is unreachable or when
 * rendering before the first settings fetch completes.  The authoritative
 * values are fetched from the backend (api/settings/) and distributed via
 * StoreSettingsContext.  Components should consume the context rather than
 * importing directly from this file wherever possible.
 */

export const STORE_SETTINGS_DEFAULTS = {
  /** Tax multiplier, e.g. 0.08 = 8 % */
  TAX_RATE: 0.08,

  /** Flat shipping fee in USD */
  SHIPPING_COST: 50,

  /** Subtotal threshold above which shipping is free */
  FREE_SHIPPING_THRESHOLD: 10000,
};
