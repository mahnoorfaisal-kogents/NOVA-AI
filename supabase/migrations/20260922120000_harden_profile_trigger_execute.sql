-- Harden the signup profile trigger so it is not callable through the public RPC surface.
REVOKE EXECUTE ON FUNCTION public.handle_new_nova_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_nova_user() TO postgres, service_role;
