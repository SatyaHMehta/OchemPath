import { createClient } from "@supabase/supabase-js";

// Debug environment variables
console.log('[SUPABASE DEBUG] Environment check:');
console.log('[SUPABASE DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[SUPABASE DEBUG] SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('[SUPABASE DEBUG] SUPABASE_URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('[SUPABASE DEBUG] SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('[SUPABASE DEBUG] SERVICE_KEY preview:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[SUPABASE ERROR] NEXT_PUBLIC_SUPABASE_URL is not set!');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[SUPABASE ERROR] SUPABASE_SERVICE_ROLE_KEY is not set!');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Server-only Supabase client — uses service role key. Do NOT expose this key to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('[SUPABASE DEBUG] Client created successfully with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

export default supabaseAdmin;
