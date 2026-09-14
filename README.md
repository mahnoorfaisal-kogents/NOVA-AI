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

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dedd623a-2eb1-4d49-9dfb-e2e20394ae4f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
