# NOVA AI — audit of the current project + new hybrid plan

Read-only audit. Nothing was changed while writing this.

## 1. Current AI architecture

```text
NOVA screens (Chat, Research)
  -> src/lib/ai/router.ts        picks an intent (simple / reasoning / coding / vision / long doc)
  -> src/lib/models.ts           8 NOVA-branded virtual models + 1 local entry
  -> src/lib/ai/providers.ts     provider registry
       - cloud  -> src/lib/ai/hybrid.functions.ts (server side)
       - local  -> Ollama, called straight from the browser
  -> src/lib/ai/personality.ts   system prompt
```

The abstraction the new direction asks for already exists: screens never name a provider, they ask the router for a model.

## 2. Current AI integration (what I built before you stopped me)

- A server-side cloud path that calls **OpenRouter** first and **NVIDIA NIM** second, with model-name maps for both. This is the part that now has to go.
- A local **Ollama** path that talks to `http://localhost:11434` from the browser, with a fixed base URL and model name kept in browser storage. No availability detection, no model list, no test button yet.
- No user-facing API-key screen was ever built, and no keys were ever added. Settings is untouched.
- No OpenAI, Anthropic, Gemini or Groq code anywhere. Those names appear only in the archived audit note.

## 3. What AI is actually available here — verified, not assumed

I sent one real request to this project's built-in AI service and read the reply: it answered **200** with real generated text. So:

- **Native inference: yes.** This project has a working, managed AI runtime with a key that stays server-side. Nothing for the user to sign up for, no keys to paste.
- **Model training or fine-tuning: no.** There is no training or fine-tuning capability in this environment, and I will not claim NOVA trains its own model. NOVA's "own model" is a NOVA-branded routing layer over inference, nothing more.
- Available capabilities are text chat (with reasoning), image generation, embeddings, speech, and video — inference only.

## 4. Existing provider references

| Reference | Where | Action |
|---|---|---|
| OpenRouter | `src/lib/ai/hybrid.functions.ts`, `src/lib/ai/providers.ts`, `src/types/index.ts`, `src/lib/models.ts` | remove |
| NVIDIA NIM | same four files | remove |
| Ollama | `src/lib/ai/providers.ts`, `src/lib/models.ts`, `src/types/index.ts` | keep and improve |
| OpenAI / Anthropic / Gemini / Groq | none in the code | nothing to do |

## 5. Files that need changing

- `src/lib/ai/hybrid.functions.ts` — replace both cloud calls with the built-in AI runtime; keep it server-side and signed-in-only.
- `src/lib/ai/providers.ts` — two providers only: managed cloud and local Ollama, plus availability detection, local model listing and a connection test.
- `src/types/index.ts` — provider ids become `nova_cloud` and `ollama`.
- `src/lib/models.ts` — the catalogue becomes the seven user-facing modes instead of model names.
- `src/lib/plans.ts` — tier lists re-pointed at those modes.
- `src/views/ChatView.tsx` — mode picker instead of model names; show whether the answer came from the cloud or the local machine.
- `src/views/SettingsView.tsx` — one small "Local AI" section: detected status, model dropdown, test button. No keys, no providers.
- `src/views/ResearchView.tsx` — use the Research mode; stop implying web sources it does not have.

## 6. Database changes

**None needed.** The 22 tables, per-user access rules, triggers and indexes are already in place and stay exactly as they are. Provider names are stored as free text in usage records, so nothing to alter. Local AI settings stay on the user's own device.

## 7. Security

- The built-in AI key is read only on the server, inside the request; it never reaches the browser.
- No API keys in the database, no fake environment variables, no key entry UI.
- Private/Offline mode calls the user's own machine only. If local AI is unreachable in that mode, NOVA says so and stops — it never quietly falls back to the cloud.
- Local models are never downloaded automatically; NOVA only lists what is already installed.
- Access rules and user isolation stay untouched.

## 8. Implementation plan (on approval)

1. Swap the cloud path in `hybrid.functions.ts` to the built-in AI runtime (streaming, signed-in only, keeps usage/token reporting).
2. Reduce the provider registry to managed cloud + local Ollama.
3. Add local detection: reachable yes/no, list of installed models, test button, clear offline message.
4. Replace the model catalogue with the seven modes: Auto, Fast, Reasoning, Coding, Research, Private/Local, Offline/Local — and map each to a runtime choice internally.
5. Wire Chat's picker to those modes and show which runtime answered each reply.
6. Add the Settings "Local AI" section; no provider or key UI anywhere.
7. Point Research at the Research mode and correct the sources wording.
8. Verify: one real cloud reply, one real local reply if Ollama is running, Private mode blocked when local is down, usage row written, all 15 screens still load, typecheck and build clean.

## 9. What cannot be done natively

- **Training or fine-tuning a NOVA model** — not available in this environment, so NOVA will not claim it.
- **Local AI on other people's devices** — Ollama only works for the person running it on their own machine; it can never be a shared cloud path.
- **Truly offline mode for the whole app** — the app itself and its data still need the network; only the model part runs locally.
- **Real web research with citations** — no search capability is configured, so Research stays model-reasoning only unless you want a search provider added later.
