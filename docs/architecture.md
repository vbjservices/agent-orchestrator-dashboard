# Architecture Reality Check

## Brutal Version

The idea is only good if it survives contact with execution.

The weak version of this product is a pile of tables, auth screens, and "agent" marketing language with no reliable runs. That version is trash.

This repo avoids that by forcing a single honest contract:

1. A workflow can be triggered.
2. A worker can execute steps in order.
3. State is persisted.
4. The dashboard can show what happened.

If one of those four breaks, you do not have an agent platform. You have slides.

## V1 Boundaries

- Dashboard: static control plane only
- Orchestrator: GitHub Actions and Node runner
- Agents: code-defined templates and step handlers
- State store: file-backed for fast iteration
- Database: explicitly deferred from runtime until the frontend and execution layer are solid

## Execution Path

Trigger:
- manual dispatch
- GitHub Actions schedule

Routing:
- orchestrator loads tenant configs
- orchestrator resolves enabled workflow instances

Execution:
- workflow steps resolve through an executor adapter boundary
- current adapter is a simulated worker contract
- real model adapters replace the simulated adapter later

Persistence:
- runner writes dashboard state to `dashboard/data/state.js`
- GitHub Actions can commit refreshed state back into the repo

Visualization:
- dashboard renders KPI, workflow, agent, orchestrator, run, step, and log state across dedicated operator views

## What This Repo Proves

- multi-tenant scoping starts with `workspace_id`
- workflow templates and workflow instances are separate
- agents are not prompts; they are typed execution units inside workflows
- orchestration and UI are separate concerns
- an always-on trigger exists outside your laptop

## What It Refuses To Fake

- "Dynamic platform" UI with no stable execution engine
- user-uploaded arbitrary code
- secrets sent to the browser
- budget governance without real server-side enforcement
- pretending a single LLM call is the platform

## Hard Next Steps

1. Replace simulated executor handlers with real server-side model adapters.
2. Turn the template and instance surfaces into real configuration flows with a backend save contract.
3. Introduce retries, dead-letter handling, and run cancellation.
4. Add auth and workspace membership checks at the dashboard/backend boundary.
5. Wire the database only after the runtime contract and UI surface stop thrashing.
