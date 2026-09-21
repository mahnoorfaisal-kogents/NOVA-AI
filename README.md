# AI Architecture Insight

You are working on an existing NOVA AI project.

DO NOT rebuild the project.

DO NOT reset or replace the database.

DO NOT delete existing features.

DO NOT make code changes yet.

First perform a complete read-only audit of the existing repository.

Inspect:

- project structure

- frontend

- backend/edge functions

- database and migrations

- RLS/authentication

- AI provider architecture

- orchestrator/model router

- conversations

- memory

- agents

- projects

- files

- tasks

- automations

- research

- security

- usage tracking

- Free/Pro/Ultimate entitlements

- settings

- environment variables

Identify all current references to:

- OpenAI

- Anthropic

- Gemini

- Groq

- OpenRouter

- NVIDIA NIM

- Ollama

Also identify:

- what is already implemented

- what is incomplete

- what is broken

- what can be safely reused

- what must be changed for a Hybrid AI architecture

TARGET ARCHITECTURE:

Local:

Ollama

Cloud:

OpenRouter

NVIDIA NIM

OpenAI, Anthropic, Gemini and Groq must NOT be reintroduced.

Do not invent APIs or endpoints.

Do not modify files during this audit.

At the end, give me:

1. Current architecture

2. Existing AI provider implementation

3. Files that would need modification

4. Database changes, if any

5. Security considerations

6. Exact implementation plan

7. Risks

8. Verification plan

WAIT FOR MY APPROVAL BEFORE MAKING ANY CODE CHANGES.

This project was built with [Lovable](https://lovable.dev).

## Current AI architecture

NOVA exposes user-facing modes instead of provider/API-key selection:

- **Auto / Fast / Reasoning / Coding / Research** — authenticated cloud inference through NOVA's managed AI runtime.
- **Private / Offline** — Ollama on the user's own machine. These modes never fall back to cloud inference.
- **Local AI settings** — detects the user's Ollama endpoint, lists installed models, supports explicit model installation, and can test local inference.
- **Server-side entitlements** — cloud mode access and daily message limits are checked against the user's plan on the server.
- **Protected accounting** — usage records are readable by the user but are written/deleted only by trusted server operations.
- **Database quotas** — project, task, agent, automation, memory, and file limits are enforced at the database boundary.

NOVA does not expose OpenAI, Anthropic, Gemini, Groq, OpenRouter, or NVIDIA NIM API-key configuration to users.

## Build with Lovable

This project was built with [Lovable](https://lovable.dev).

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dedd623a-2eb1-4d49-9dfb-e2e20394ae4f).

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
