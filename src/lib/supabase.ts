import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;
let hasLoggedMissingEnv = false;

function resolveServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_DB_PASSWORD
  );
}

function createSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = resolveServiceRoleKey();

  if (!supabaseUrl || !supabaseServiceKey) {
    if (!hasLoggedMissingEnv) {
      hasLoggedMissingEnv = true;
      console.error("Supabase admin client unavailable", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(supabaseServiceKey),
      });
    }
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  cachedClient = createSupabaseAdmin();
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseAdmin());
}
