import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ahqcjymeeifftcrglani.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocWNqeW1lZWlmZnRjcmdsYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjE0MjksImV4cCI6MjA4ODEzNzQyOX0.6StFPve6BwrWEisSbY20H0q_FpqL0ABCJLXnCGdhSoI";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
