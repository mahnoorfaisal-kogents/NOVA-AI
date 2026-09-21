import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DeleteInput = z.object({ confirm: z.literal("DELETE") });

const USER_TABLES = [
  "messages",
  "conversation_summaries",
  "conversations",
  "memories",
  "file_versions",
  "project_files",
  "folders",
  "tasks",
  "agent_runs",
  "agents",
  "automation_runs",
  "automations",
  "preferences",
  "notifications",
  "audit_logs",
  "activity_events",
  "approval_requests",
  "knowledge_entities",
  "timeline_entries",
  "projects",
] as const;

export const deleteAllUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    if (data.confirm !== "DELETE") {
      return { ok: false, error: "Confirmation is required." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const failures: string[] = [];

    // Delete children before parents so this remains safe with FK constraints.
    for (const table of USER_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", context.userId);
      if (error) failures.push(table + ": " + error.message);
    }

    // Usage telemetry is immutable to normal users but must be removed by an
    // explicit account-data deletion request.
    const { error: usageError } = await supabaseAdmin
      .from("usage_records")
      .delete()
      .eq("user_id", context.userId);
    if (usageError) failures.push("usage_records: " + usageError.message);

    if (failures.length > 0) {
      return { ok: false, error: "Some NOVA data could not be deleted.", failures };
    }

    return { ok: true, error: null };
  });
