# Agent Orchestrator Dashboard

This repo starts the platform as a strict V1:

- dashboard = control plane
- orchestrator = trigger + routing
- agents = task definitions
- execution = worker layer

The important boundary is simple: this repo does not pretend Codex is the platform. Codex is only one execution worker inside workflows.

## Current V1 Scope

- code-first workflow definitions
- multi-tenant workspace configs
- file-backed orchestration state for fast iteration
- static dashboard for visibility and manual review
- GitHub Actions for always-on scheduled or manual execution
- no runtime database connection yet
- database schema parked as future integration groundwork only

## Run Locally

Generate fresh orchestrator state:

```powershell
node orchestrator/run.mjs
```

Run only one workspace:

```powershell
node orchestrator/run.mjs --workspace=vbj-services
```

Run the built-in verification:

```powershell
node --test --test-isolation=none
```

Open the dashboard:

- load [index.html](./index.html) or [dashboard/index.html](./dashboard/index.html) directly in a browser, or
- serve the repo with any static file server

## Repo Layout

- [dashboard/index.html](./dashboard/index.html): static control-plane UI
- [orchestrator/run.mjs](./orchestrator/run.mjs): CLI entrypoint
- [orchestrator/lib/runner.mjs](./orchestrator/lib/runner.mjs): orchestrator engine
- [orchestrator/lib/catalog.mjs](./orchestrator/lib/catalog.mjs): agent and workflow templates
- [config/workspaces/vbj-services.json](./config/workspaces/vbj-services.json): tenant config example
- [docs/build-status.md](./docs/build-status.md): living record of what is actually built
- [docs/target-state.md](./docs/target-state.md): target product scope and direction
- [supabase/schema.sql](./supabase/schema.sql): parked schema draft for later, not active runtime
- [docs/architecture.md](./docs/architecture.md): hard architecture boundaries

## What Is Deliberately Missing

- arbitrary user-defined code execution
- frontend-side secrets
- live external LLM adapters
- billing, budgets, and full governance automation
- drag-and-drop workflow builder

Those come later. If you build them now, you are optimizing the wrong layer.
