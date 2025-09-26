import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client — uses service role key. Do NOT expose this key to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabaseAdmin;
