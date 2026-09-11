# NOVA roadmap

## Open (awaiting approval)
- [ ] Replace the OpenRouter/NVIDIA cloud path with the platform's built-in AI runtime (verified working).
- [ ] Keep Ollama as the local option: availability detection, model list, model picker, connection test, graceful offline handling.
- [ ] Replace model names in the picker with intent modes: Auto, Fast, Reasoning, Coding, Research, Private/Local, Offline/Local.
- [ ] No user-facing API key or provider configuration anywhere in Settings.
- [ ] Private/Offline mode must never reach a cloud service.

## Done
- [x] Ported the NOVA app (all 15 screens, contexts, design system) onto this project's stack.
- [x] Applied the existing NOVA schema (22 tables, per-user access rules, triggers, indexes) — no reset.
