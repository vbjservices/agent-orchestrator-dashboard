# Agent Orchestrator Dashboard

This repo starts the platform as a strict V1:

- dashboard = control plane
- orchestrator = trigger + routing
- agents = task definitions
- execution = worker layer

The important boundary is simple: this repo does not pretend Codex is the platform. Codex is only one execution worker inside workflows.

## Current V1 Scope

- content-first M1 around the content pipeline workflow
- code-first workflow definitions
- agent templates with explicit runtime and SOP metadata
- workflow templates with explicit trigger and instance-config contracts
- multi-tenant workspace configs
- file-backed orchestration state for fast iteration
- static dashboard with separate dashboard, search, workflows, agents, and orchestrators views
- template-versus-instance surfaces for workflows and agents
- dashboard KPI, AI-team, and activity-feed surfaces centered on content execution
- structured SOP library under `knowledge/sops/`
- executor adapter boundary with a simulated default adapter
- contract validation for templates, executors, and workspace workflow configs
- GitHub Actions manual dispatch and cron schedule as the only active M1 runtime routes
- lead qualification kept in the repo as a manual-only secondary workflow surface, not an active M1 runtime path
- SonarQube project config prepared at the repo root
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
- [dashboard/assets/icons/](./dashboard/assets/icons): dedicated UI icon assets for agents and future user identities
- [dashboard/app/model/](./dashboard/app/model): dashboard state selectors split by domain
- [dashboard/styles/m1-foundation.css](./dashboard/styles/m1-foundation.css): M1 UI contract layer and overrides
- [orchestrator/run.mjs](./orchestrator/run.mjs): CLI entrypoint
- [orchestrator/lib/runner.mjs](./orchestrator/lib/runner.mjs): orchestrator engine
- [orchestrator/lib/validation.mjs](./orchestrator/lib/validation.mjs): contract validation for templates and workspace configs
- [orchestrator/executors/adapters/index.mjs](./orchestrator/executors/adapters/index.mjs): executor adapter registry
- [orchestrator/agents/templates/index.mjs](./orchestrator/agents/templates/index.mjs): agent template registry
- [orchestrator/agents/handlers/index.mjs](./orchestrator/agents/handlers/index.mjs): step handler registry
- [orchestrator/workflows/templates/index.mjs](./orchestrator/workflows/templates/index.mjs): workflow template registry
- [config/workspaces/vbj-services.json](./config/workspaces/vbj-services.json): tenant config example
- [knowledge/sops/README.md](./knowledge/sops/README.md): operating procedure library
- [sonar-project.properties](./sonar-project.properties): SonarQube scan configuration
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
