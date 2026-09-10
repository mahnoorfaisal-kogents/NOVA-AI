/**
 * NOVA views import the browser client from here.
 *
 * The underlying client is the generated integration client, so session
 * handling stays consistent. It is re-exported with a loose schema type
 * because the NOVA tables carry their own hand-written row types in
 * `src/types` rather than generated database types.
 */
import { supabase as generatedClient } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = generatedClient as unknown as SupabaseClient<any, "public", any>;
