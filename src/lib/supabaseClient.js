import { createClient } from '@supabase/supabase-js';

// Define the absolute Project URL we found in the backend
const supabaseUrl = 'https://dohscpundxptaknfgjcf.supabase.co';

// For security, the frontend MUST use the ANON key. 
// Do NOT hardcode the SERVICE_ROLE_KEY here as it bypasses all Row Level Security and exposes the database.
// The user will replace this placeholder with their actual ANON key.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHNjcHVuZHhwdGFrbmZnamNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTkyNzAsImV4cCI6MjA5MTA5NTI3MH0.LaObNy4IByie5GI_Zk6LIj2LhordSxy5nLD-MizSLM4';

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY is missing from environment variables. Using embedded anon key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
