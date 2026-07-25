/**
 * Centralized App Configuration
 * This file handles environment variables and fallback values for Local vs Production.
 */

const CONFIG = {
  // Pull from VITE_API_BASE_URL in .env, fallback to live Render production backend
  API_BASE: import.meta.env.VITE_API_BASE_URL || 'https://replyvera-backend.onrender.com',
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export default CONFIG;
