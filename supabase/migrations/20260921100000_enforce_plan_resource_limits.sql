-- Enforce plan resource quotas at the database boundary. UI checks are only
-- presentation; authenticated clients must not be able to bypass limits by
-- calling Supabase directly.
CREATE OR REPLACE FUNCTION public.enforce_nova_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_plan text;
  max_count integer;
  current_count integer;
  max_storage_mb integer;
  current_storage bigint;
BEGIN
  SELECT plan INTO current_plan FROM public.profiles WHERE id = NEW.user_id;

  IF current_plan IS NULL THEN
    RAISE EXCEPTION 'NOVA profile not found';
  END IF;

  IF TG_TABLE_NAME = 'projects' THEN
    max_count := CASE current_plan WHEN 'free' THEN 3 WHEN 'pro' THEN 25 WHEN 'ultimate' THEN 100 END;
    SELECT count(*) INTO current_count FROM public.projects WHERE user_id = NEW.user_id;
    IF current_count >= max_count THEN RAISE EXCEPTION 'Project limit reached for % plan', current_plan; END IF;

  ELSIF TG_TABLE_NAME = 'tasks' THEN
    max_count := CASE current_plan WHEN 'free' THEN 50 WHEN 'pro' THEN 500 WHEN 'ultimate' THEN 5000 END;
    SELECT count(*) INTO current_count FROM public.tasks WHERE user_id = NEW.user_id;
    IF current_count >= max_count THEN RAISE EXCEPTION 'Task limit reached for % plan', current_plan; END IF;

  ELSIF TG_TABLE_NAME = 'agents' THEN
    max_count := CASE current_plan WHEN 'free' THEN 3 WHEN 'pro' THEN 15 WHEN 'ultimate' THEN 50 END;
    SELECT count(*) INTO current_count FROM public.agents WHERE user_id = NEW.user_id;
    IF current_count >= max_count THEN RAISE EXCEPTION 'Agent limit reached for % plan', current_plan; END IF;

  ELSIF TG_TABLE_NAME = 'automations' THEN
    max_count := CASE current_plan WHEN 'free' THEN 2 WHEN 'pro' THEN 25 WHEN 'ultimate' THEN 100 END;
    SELECT count(*) INTO current_count FROM public.automations WHERE user_id = NEW.user_id;
    IF current_count >= max_count THEN RAISE EXCEPTION 'Automation limit reached for % plan', current_plan; END IF;

  ELSIF TG_TABLE_NAME = 'memories' THEN
    max_count := CASE current_plan WHEN 'free' THEN 100 WHEN 'pro' THEN 1000 WHEN 'ultimate' THEN 10000 END;
    SELECT count(*) INTO current_count FROM public.memories WHERE user_id = NEW.user_id;
    IF current_count >= max_count THEN RAISE EXCEPTION 'Memory limit reached for % plan', current_plan; END IF;

  ELSIF TG_TABLE_NAME = 'project_files' THEN
    max_count := CASE current_plan WHEN 'free' THEN 25 WHEN 'pro' THEN 200 WHEN 'ultimate' THEN 1000 END;
    max_storage_mb := CASE current_plan WHEN 'free' THEN 50 WHEN 'pro' THEN 500 WHEN 'ultimate' THEN 5000 END;

    SELECT count(*) INTO current_count
      FROM public.project_files
      WHERE user_id = NEW.user_id AND deleted = false;

    SELECT COALESCE(sum(file_size), 0) INTO current_storage
      FROM public.project_files
      WHERE user_id = NEW.user_id AND deleted = false;

    IF current_count >= max_count THEN
      RAISE EXCEPTION 'File count limit reached for % plan', current_plan;
    END IF;

    IF current_storage + COALESCE(NEW.file_size, 0) > (max_storage_mb::bigint * 1024 * 1024) THEN
      RAISE EXCEPTION 'File storage limit reached for % plan', current_plan;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_projects_plan_limit ON public.projects;
CREATE TRIGGER trigger_projects_plan_limit BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();

DROP TRIGGER IF EXISTS trigger_tasks_plan_limit ON public.tasks;
CREATE TRIGGER trigger_tasks_plan_limit BEFORE INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();

DROP TRIGGER IF EXISTS trigger_agents_plan_limit ON public.agents;
CREATE TRIGGER trigger_agents_plan_limit BEFORE INSERT ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();

DROP TRIGGER IF EXISTS trigger_automations_plan_limit ON public.automations;
CREATE TRIGGER trigger_automations_plan_limit BEFORE INSERT ON public.automations
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();

DROP TRIGGER IF EXISTS trigger_memories_plan_limit ON public.memories;
CREATE TRIGGER trigger_memories_plan_limit BEFORE INSERT ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();

DROP TRIGGER IF EXISTS trigger_project_files_plan_limit ON public.project_files;
CREATE TRIGGER trigger_project_files_plan_limit BEFORE INSERT ON public.project_files
FOR EACH ROW EXECUTE FUNCTION public.enforce_nova_plan_limits();
