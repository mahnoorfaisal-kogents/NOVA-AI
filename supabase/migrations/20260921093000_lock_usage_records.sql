-- Usage records are accounting/entitlement telemetry. Browser sessions may read
-- their own records, but must never create or delete them.
DROP POLICY IF EXISTS "insert_own_usage" ON public.usage_records;
DROP POLICY IF EXISTS "delete_own_usage" ON public.usage_records;

REVOKE INSERT, DELETE ON public.usage_records FROM authenticated;
GRANT SELECT ON public.usage_records TO authenticated;
GRANT ALL ON public.usage_records TO service_role;

-- Server-side usage rows must always belong to the authenticated user context
-- when a trusted server acts on their behalf.
ALTER TABLE public.usage_records
  DROP CONSTRAINT IF EXISTS usage_records_user_id_fkey;
ALTER TABLE public.usage_records
  ADD CONSTRAINT usage_records_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_usage_user_resource_created
  ON public.usage_records(user_id, resource_type, created_at DESC);
