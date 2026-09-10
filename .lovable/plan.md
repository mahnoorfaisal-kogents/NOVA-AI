# NOVA AI — Read-only audit + Hybrid AI plan

No files were changed. Everything below comes from reading the uploaded NOVA archive.

## Important finding first

The uploaded NOVA code is **not** what is currently running in this Lovable project. This project still contains the untouched starter template (TanStack Start + React 19, no backend connected, blank home page). The NOVA app is a separate Vite + React 18 + React Router + Supabase app inside the zip.

So "do not rebuild" needs a decision from you: the NOVA code must first be brought into this project before any hybrid-AI work can touch it. I have not moved anything yet.

## 1. Current architecture

- **Frontend**: Vite 5, React 18, React Router 7, Tailwind 3, Lucide icons. `App.tsx` mounts sidebar + top bar + command palette and routes 15 views: Home, Chat, Projects, Tasks, Memory, Agents, Automations, Files, Search, Research, Settings, Usage, Timeline, Knowledge Graph, Security Center.
- **State**: three contexts — Auth (session + profile + plan), Theme, Notifications. No data-fetching library; each view queries Supabase directly with `useEffect`.
- **Backend**: one Supabase Edge Function, `nova-chat`. Everything else is direct client→database access under RLS.
- **Database**: a single migration creating 22 tables (profiles, projects, folders, conversations, messages, conversation_summaries, memories, project_files, file_versions, tasks, agents, agent_runs, automations, automation_runs, preferences, notifications, usage_records, audit_logs, activity_events, approval_requests, knowledge_entities, timeline_entries) plus indexes, an on-signup profile trigger, and updated-at triggers.
- **Security**: row-level security on every table, four separate policies per table, all scoped to `auth.uid()`, `authenticated` role only. Owner columns default to `auth.uid()`. No wide-open policies. Solid.
- **Entitlements**: `src/lib/plans.ts` defines Free / Pro / Ultimate limits and feature flags; plan is a column on `profiles`. Limits are used for model filtering and display, but most caps (messages/day, storage, counts) are not enforced anywhere.
- **Usage tracking**: `usage_records` rows are written after each chat reply with model, provider and token counts; the Usage view aggregates them.

## 2. Existing AI provider implementation

- `src/lib/models.ts` — eight virtual NOVA models (nova-fast, nova-standard, nova-reasoning, nova-coding, nova-research, nova-vision, nova-long-context, nova-multimodal), each with capabilities, context window, min plan.
- `src/lib/ai/router.ts` — task classifier (coding / vision / long_document / reasoning / simple) plus plan-aware model selection with a fallback slot.
- `src/lib/ai/providers.ts` — one real provider, `nova_default`, which POSTs to the `nova-chat` function. Six other entries (openai, anthropic, gemini, groq, openai_compatible, ollama) are dead stubs that only return "not configured".
- `src/lib/ai/personality.ts` — system-prompt builder.
- `supabase/functions/nova-chat/index.ts` — the only place real API calls happen. It maps NOVA model ids to OpenAI (`gpt-4o-mini`, `gpt-4o`, `o3-mini`) and Anthropic (`claude-sonnet-4-20250514`), reads `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, and 503s when neither exists. No streaming; no OpenRouter, NVIDIA NIM, Groq or Ollama code exists anywhere.

### Provider references found
| Provider | Where |
|---|---|
| OpenAI | `nova-chat` (real calls, model map, key, error text); stub + `ProviderId` in frontend |
| Anthropic | `nova-chat` (real calls, model map, key, error text); stub + `ProviderId` |
| Gemini | stub + `ProviderId` only |
| Groq | stub + `ProviderId` only |
| OpenRouter | none |
| NVIDIA NIM | none |
| Ollama | stub + `ProviderId` only, no implementation |

### State of the features
- **Working**: auth, profiles/plans, conversations, messages, projects, tasks, memory, agents (CRUD), automations (CRUD), files, search, timeline, knowledge graph, security center, usage, settings, notifications, chat send/regenerate/model picker.
- **Incomplete**: agents and automations never execute (no runner writes `agent_runs` / `automation_runs`); Research is five sequential model calls with no real web search despite the "Sources" wording; no streaming replies; plan caps unenforced; costs always null; file versioning tables unused by the UI; Settings has no provider/model/endpoint section.
- **Broken today**: chat, and therefore Research, fails with a 503 unless an OpenAI or Anthropic key is set — both of which you are removing.
- **Safely reusable**: the whole database and RLS layer, all views, the router/personality/model abstraction, usage recording, plans.
- **Must change**: `nova-chat` internals, the provider registry, `ProviderId`, the model catalog's provider mapping, plan model lists.

## 3. Files that would need modification

- `supabase/functions/nova-chat/index.ts` — replace the OpenAI/Anthropic bodies with OpenRouter, NVIDIA NIM and Ollama routing plus fallback.
- `src/types/index.ts` — `ProviderId` becomes `'nova_default' | 'openrouter' | 'nvidia_nim' | 'ollama'`.
- `src/lib/ai/providers.ts` — delete the six stubs; add a local Ollama provider that calls the user's own endpoint from the browser, keep `nova_default` for cloud.
- `src/lib/models.ts` — keep the NOVA-branded ids, re-point each to its OpenRouter / NIM / Ollama target and correct context windows.
- `src/lib/plans.ts` — reassign which models each tier gets under the new mix.
- `src/views/SettingsView.tsx` — new "AI providers" tab: cloud-vs-local preference, Ollama base URL and model, connection test.
- `src/views/ChatView.tsx`, `src/views/ResearchView.tsx` — surface which provider answered and handle local-unreachable errors.

## 4. Database changes

Minimal, additive only, no resets:
- extend the `provider` values written to `usage_records` (free text today, so no migration strictly needed);
- optionally one new migration adding `GRANT` statements, which the existing migration omits entirely — worth adding since Supabase no longer grants Data API access by default;
- Ollama endpoint/model preferences can live in the existing `preferences` table with no schema change.

## 5. Security considerations

- OpenRouter and NVIDIA NIM keys stay server-side as edge-function secrets; never in `VITE_*` or client code.
- `nova-chat` is currently fully open (`Access-Control-Allow-Origin: *`, no auth check, anon key accepted). It should verify the caller's JWT and enforce per-plan rate limits before spending cloud credits.
- Ollama is local-only: the browser talks to `http://localhost:11434` directly, so the URL must be validated and never proxied through the server (SSRF).
- Keep RLS untouched; add the missing grants.
- Research must stop implying sources it does not have.

## 6. Implementation plan (on approval)

1. Bring the NOVA app into this project, preserving the migration and all views. Confirm with you whether to port onto this project's TanStack stack or keep the app's own Vite/React Router setup.
2. Enable Lovable Cloud and apply the existing schema as-is, plus a small additive grants migration.
3. Rewrite `nova-chat` as a hybrid router: OpenRouter primary cloud path, NVIDIA NIM secondary, JWT check, plan-aware limits, usage logging, no OpenAI/Anthropic/Gemini/Groq.
4. Replace the frontend provider registry with `nova_default` (cloud) + `ollama` (local, direct browser call) and prune the removed ids.
5. Re-map the NOVA model catalog and tier lists to the new providers.
6. Add the Settings "AI providers" tab with local endpoint config and a test button.
7. Show the answering provider in Chat and give clear local-offline / cloud-unavailable messaging.

## 7. Risks

- Porting to a different frontend stack is where regressions would appear; keeping the app's own stack avoids that but means the two setups diverge.
- Local Ollama will be unreachable for anyone not running it, so cloud must remain the default.
- Model ids and context windows differ per provider; wrong ids produce runtime 4xx, so each path needs one real verified call.
- Browser→localhost calls need CORS enabled on the Ollama side; that is a user-side setting.
- Adding auth to `nova-chat` breaks any caller relying on the anon key.

## 8. Verification plan

- One real request through each path: OpenRouter, NVIDIA NIM, Ollama — read the response, not just the status.
- Confirm no reference to OpenAI, Anthropic, Gemini or Groq remains anywhere in the tree.
- Chat end-to-end as a signed-in user: send, regenerate, switch model, confirm a `usage_records` row lands with the right provider.
- Confirm a signed-out call to `nova-chat` is rejected.
- Walk each of the 15 views signed in to confirm nothing regressed; confirm cross-user isolation still holds.
- Typecheck and build clean.
