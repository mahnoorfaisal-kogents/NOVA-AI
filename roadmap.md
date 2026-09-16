# NOVA roadmap

## Done
- [x] Ported the NOVA app (all 15 screens, contexts, design system) onto this project's stack.
- [x] Applied the existing NOVA schema (22 tables, per-user access rules, triggers, indexes) — no reset.
- [x] Cloud answers use the platform's built-in AI runtime (verified: real replies, key stays server-side).
- [x] Intent modes only: Auto, Fast, Reasoning, Coding, Research, Private/Local, Offline/Local. No API key or provider screens.
- [x] Local AI (Ollama): availability detection, installed-model list, model picker, one-click model test, step-by-step troubleshooting when unreachable or model missing.
- [x] One-click mode check in Settings → Local AI: per-mode source (cloud vs this device), timing and errors.
- [x] Verified Private/Offline hard-fail with local AI off — only localhost:11434 is contacted, no cloud call.

## Notes / limits
- Reasoning, Coding and Research need a Pro plan; the mode check reports them as not tested on Free.
- Research uses NOVA's existing knowledge; it does not browse the live web.
