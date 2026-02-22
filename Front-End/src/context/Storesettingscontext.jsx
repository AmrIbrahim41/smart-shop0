/**
 * StoreSettingsContext.jsx
 *
 * Provides real-time store configuration (tax_rate, shipping_cost,
 * free_shipping_threshold) fetched from the Django backend.
 *
 * Usage
 * ─────
 *   // Wrap your app (e.g. in main.jsx / App.jsx):
 *   <StoreSettingsProvider>
 *     <App />
 *   </StoreSettingsProvider>
 *
 *   // Consume anywhere:
 *   const { taxRate, shippingCost, freeShippingThreshold, loading } = useStoreSettings();
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiService } from "../api";
import { STORE_SETTINGS_DEFAULTS } from "../constants";

// ---------------------------------------------------------------------------
// Context & hook
// ---------------------------------------------------------------------------

const StoreSettingsContext = createContext(null);

/**
 * Returns the store settings and a refresh helper.
 * Must be used inside <StoreSettingsProvider>.
 */
export const useStoreSettings = () => {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error(
      "useStoreSettings must be used within a <StoreSettingsProvider>"
    );
  }
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const StoreSettingsProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expose settings as plain JS numbers for easy arithmetic in components
  const [taxRate, setTaxRate] = useState(STORE_SETTINGS_DEFAULTS.TAX_RATE);
  const [shippingCost, setShippingCost] = useState(
    STORE_SETTINGS_DEFAULTS.SHIPPING_COST
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    STORE_SETTINGS_DEFAULTS.FREE_SHIPPING_THRESHOLD
  );

  /** Fetch settings from the backend and update state */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiService.getStoreSettings();
      setTaxRate(parseFloat(data.tax_rate));
      setShippingCost(parseFloat(data.shipping_cost));
      setFreeShippingThreshold(parseFloat(data.free_shipping_threshold));
    } catch (err) {
      console.error("[StoreSettings] Failed to fetch settings:", err);
      setError("Could not load store settings. Using defaults.");
      // Keep the safe defaults already set in useState
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = {
    taxRate,
    shippingCost,
    freeShippingThreshold,
    loading,
    error,
    /** Call this after an admin saves new settings to refresh all consumers */
    refreshSettings: fetchSettings,
  };

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export default StoreSettingsContext;
