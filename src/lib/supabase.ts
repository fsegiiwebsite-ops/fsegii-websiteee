import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://nnnlhkjjkigjpknfprqo.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubmxoa2pqa2lnanBrbmZwcnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjUzNTYsImV4cCI6MjA4OTM0MTM1Nn0.ZyAVziydQAKKARt_VcwQmEbvOb4X0VyUam34sdtYfXU";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
