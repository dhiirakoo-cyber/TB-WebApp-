import { createClient } from "@supabase/supabase-js";

// Retrieve configuration from environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://dpofcychcwnodlwcblyn.supabase.co";
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_Z-8LuYQrGv1BmC7c3oNyCg_zojgZvdS";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
