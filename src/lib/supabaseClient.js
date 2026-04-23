import { createClient } from '@supabase/supabase-js';

// Define the absolute Project URL we found in the backend
const supabaseUrl = 'https://dohscpundxptaknfgjcf.supabase.co';

// For security, the frontend MUST use the ANON key. 
// Do NOT hardcode the SERVICE_ROLE_KEY here as it bypasses all Row Level Security and exposes the database.
// The user will replace this placeholder with their actual ANON key.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
