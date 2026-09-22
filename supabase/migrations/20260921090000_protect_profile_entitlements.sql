-- Security hardening: entitlement state must never be writable by a browser session.
-- The UI also strips these fields, but the database remains the final trust boundary.
CREATE OR REPLACE FUNCTION public.prevent_client_profile_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.plan IS DISTINCT FROM OLD.plan
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Protected profile fields may only be changed by a trusted server';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profiles_protected_fields ON public.profiles;
CREATE TRIGGER trigger_profiles_protected_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_profile_privilege_changes();
