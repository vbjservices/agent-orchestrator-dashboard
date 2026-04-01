# Build Status

This file is the living record of what is actually built in the repo.

Rule:
- Whenever the repo changes in a meaningful way, this document gets updated in the same change set.
- If it is out of date, the repo is being described dishonestly.

Last updated:
- 2026-04-01

## Current Focus

The active build focus is:

- frontend control plane
- orchestrator runtime
- agent and workflow definitions

The active build focus is not:

- live database wiring
- auth flows
- billing
- arbitrary user code execution

## What Exists Today

### Frontend

- Static dashboard in `dashboard/`
- Dashboard source split into smaller modules for state, activity rules, loaders, and renderers
- Dark cyber control-room visual theme
- Hero title scaled down so the interface reads like an operator console instead of a landing page
- Pulse bar loaders for independently staged dashboard sections
- Agent launch grid with workflow-specific fire actions and visible agent chains
- Color-coded workflow and agent activity states using `running`, `stopped`, and `error`
- Compact clickable agent nodes with focused detail rail
- Operator control bar with search and status filtering
- Workspace spotlight panel for current scope context
- Command deck with copyable manual run shortcuts
- Workspace filtering
- Workflow instance overview
- Run history ledger
- Run detail trace with scoped metadata, step pills, collapsible artifacts, and logs

### Orchestrator

- Node-based runner in `orchestrator/`
- Workspace config loading from `config/workspaces/`
- Workflow template catalog
- Step execution handlers
- Generated dashboard state output to `dashboard/data/state.js`
- Runtime snapshot output to `runtime/last-run.json`

### Agents and Workflows

- Content pipeline workflow
- Lead qualification workflow
- Agent templates for research, ideation, scripting, qualification, and DM response
- Two sample tenant workspaces with instance-level configuration

### Automation

- GitHub Actions workflow for manual and scheduled runs
- Test coverage for the main orchestrator write path

### Planning and Architecture

- Architecture boundary doc in `docs/architecture.md`
- Target product doc in `docs/target-state.md`
- Parked database schema draft in `supabase/schema.sql`

## What Is Verified

- `node orchestrator/run.mjs`
- `node orchestrator/run.mjs --workspace=vbj-services`
- `node --test --test-isolation=none`

## What Is Still Fake

- Executor handlers are simulated and deterministic
- No real model provider is connected
- No real backend API exists yet
- No database writes happen at runtime
- No authentication or tenant enforcement exists in the UI path

## Folder Structure

This is the current structure we are keeping clean:

- `dashboard/`: static frontend and generated dashboard state
- `dashboard/app/`: modular dashboard source split by responsibility
- `orchestrator/`: runtime entrypoint and orchestration engine
- `config/`: tenant and workflow instance configuration
- `docs/`: architecture, build status, and target-state documents
- `.github/workflows/`: always-on orchestration triggers
- `tests/`: runtime verification
- `supabase/`: deferred database groundwork, not active runtime code

## Immediate Next Build Steps

1. Replace the fake executor contract with a real provider adapter boundary.
2. Turn the command deck and operator controls into actual run actions instead of copy-only shortcuts.
3. Add workflow-level drill-down and better failure surfacing in the dashboard.
4. Keep the runtime file-backed until the workflow and UI surfaces stop changing aggressively.
