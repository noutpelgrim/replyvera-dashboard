/**
 * Centralized App Configuration
 * This file handles environment variables and fallback values for Local vs Production.
 */

const CONFIG = {
  // Always point to active Railway production backend
  API_BASE: (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('onrender'))
    ? import.meta.env.VITE_API_BASE_URL
    : 'https://replyvera-backend-production.up.railway.app',
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export default CONFIG;
