/**
 * src/config/supabaseClient.js
 * Aquarius OS · Unified Supabase Client Gateway
 *
 * Single shared instance consumed across all app modules.
 * Handles auth state, DB queries, and real-time subscriptions.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "[supabaseClient] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage across page reloads
    persistSession:    true,
    // Automatically refresh the JWT before expiry
    autoRefreshToken:  true,
    // Detect OAuth callback tokens from the URL hash/query
    detectSessionInUrl: true,
    // Use PKCE flow — most secure for SPAs
    flowType: "pkce",
  },
});

export default supabase;
