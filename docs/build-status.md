# Build Status

This file is the living record of what is actually built in the repo.

Rule:
- Whenever the repo changes in a meaningful way, this document gets updated in the same change set.
- If it is out of date, the repo is being described dishonestly.

Last updated:
- 2026-04-04

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
- Root `index.html` redirects branch-based static hosting to `dashboard/`
- Dashboard source split into smaller modules for state, loaders, renderers, and domain-specific model selectors
- Dashboard CSS is now split into `dashboard/styles/base.css`, `dashboard/styles/shared.css`, `dashboard/styles/dashboard.css`, `dashboard/styles/platform.css`, `dashboard/styles/runs.css`, and `dashboard/styles/responsive.css`
- Dashboard CSS now also includes a dedicated `dashboard/styles/kpi.css` module for the analytics surface
- `dashboard/styles.css` is now a thin manifest instead of a 2k-line dump file
- M1 UI changes still land in `dashboard/styles/m1-foundation.css` instead of bloating the base modules further
- Dark cyber control-room visual theme
- Theme now leans into a darker blue neon data-console style with colder panel surfaces, stronger blue-violet glow hierarchy, and reduced warm accent overuse
- Visual system tightened toward a more restrained professional operator-console look
- Dashboard styling now leans into a denser operations-board layout with darker matte surfaces, compact cards, and subtler accent hierarchy
- Hero title scaled down so the interface reads like an operator console instead of a landing page
- Layout grids, modal surfaces, and action rows now scale more cleanly across desktop, tablet, and phone sizes
- Dashboard split into dedicated navigation surfaces for `Dashboard`, `Search`, `Workflows`, `Agents`, and `Orchestrators`
- Dashboard navigation now also includes dedicated `Pipeline`, `Analytics`, and `Tasks` surfaces for content operations
- Dashboard navigation now also includes a dedicated `Research` surface for runtime-backed topic discovery, competitor pulse, and idea-bank review
- `Analytics` now contains internal `Performance` and `KPIs` tabs so content outcomes and control-plane metrics stay grouped in one page
- Desktop navigation now uses an icon-led vertical sidebar rail, plus mobile drawer navigation
- Shell now includes a compact application top bar for command-center context, sync state, refresh timestamp, and active view breadcrumb
- Shell now includes a compact application top bar that shows the active tab name plus sync metadata without extra breadcrumb noise
- Mobile drawer now has explicit open, close, backdrop-close, and escape-close behavior, with a utility-style close control that is visually separate from the tabs
- Search, status filtering, and workspace scoping now live in a dedicated `Search` tab instead of bloating the dashboard surface
- `Pipeline` tab now uses a single auto-advancing board as the source of truth, with per-lane counts in the headers instead of a duplicated summary section
- `Pipeline` lane cards now stretch more consistently so content and footers align from top to bottom within each lane
- `Research` tab now shows runtime-derived topic rows, deterministic competitor pulse cards built from workspace competitor config, and a sticky idea-bank rail sourced from content research plus ideation outputs
- `Analytics / Performance` shows simulated Instagram, TikTok, and YouTube performance derived from current content outputs, plus a sticky insights rail
- `Analytics / KPIs` shows a dedicated analytics deck with execution trend charts, workflow health rings, platform signal cards, pipeline state bars, workspace throughput, agent load, and spotlight notes
- `Tasks` tab now shows agent workload cards, a prioritized derived task queue, and a sticky recent task-activity rail
- `Tasks` agent cards now focus on the current or next task plus a single up-next hint, instead of repeating queue internals and duplicated step names
- Dashboard hero and mode cards were removed so the main dashboard stays focused on execution surfaces
- Dashboard now centers on KPI cards, content-agent progress cards, and a right-side content activity feed instead of a workspace spotlight plus generic run list
- Activity feed now lives in a dedicated sticky right rail on desktop so execution history stays visible while the main dashboard scrolls
- Activity rail now defaults to a narrower width and can be resized with a drag handle like a normal desktop panel
- The activity rail resize handle is now integrated into the outer edge of the rail itself instead of living in a separate gutter between content and feed
- Activity rail scrollbar chrome is hidden so the feed reads cleaner while staying scrollable
- Activity feed now mixes step-level runtime events with a small set of explicit simulated ops events so the rail shows broader agent activity during M1
- Activity feed run titles now use agent-specific color coding and stronger success/failure emphasis
- Workflow, agent, and orchestrator tabs now use lighter scope summaries instead of reusing dashboard-heavy context blocks
- Workflow cards keep a consistent width instead of stretching based on how many cards are visible
- Pulse bar loaders for independently staged dashboard sections
- Minimal clickable workflow cards with full workflow detail moved into a popup
- Workflow popup leads with its attached agent chain so the execution surface shows before metadata
- Separate workflow template and workflow instance surfaces
- Separate agent template and agent instance surfaces
- Agent and workflow popups now expose SOP links, runtime contracts, and artifact summaries instead of fake fire buttons
- Orchestrator surface now stays honest about GitHub Actions as the only M1 runtime route, with manual dispatch and cron schedule only
- Shared SVG avatar icon for displayed agents across launch and trace surfaces
- Agent avatar now uses a dedicated bot asset in `dashboard/assets/icons/`, while the previous person icon is preserved for future user identity surfaces
- Agent avatar system now uses square role-based badges under `dashboard/assets/icons/agents/`, while the older generic bot and user avatar assets remain preserved for future identity surfaces
- AI team header now shows the live count of visible agents in scope
- Clickable agent chain inside the workflow popup plus popup-only agent detail instead of a fixed side rail
- Color-coded workflow and agent activity states using `running`, `stopped`, and `error`
- Operator control bar with search and status filtering
- Workspace filtering
- Workflow instance overview through compact cards and workflow popup detail
- Run history ledger
- Run detail trace with scoped metadata, step pills, collapsible artifacts, and logs

### Orchestrator

- Node-based runner in `orchestrator/`
- Workspace config loading from `config/workspaces/`
- Agent templates split into dedicated modules under `orchestrator/agents/templates/`
- Workflow templates split into dedicated modules under `orchestrator/workflows/templates/`
- Step execution handlers split into dedicated modules under `orchestrator/agents/handlers/`
- Agent templates now carry runtime, input, config, and SOP metadata
- Executor adapter boundary lives under `orchestrator/executors/adapters/`
- Runtime contract validation lives in `orchestrator/lib/validation.mjs`
- Generated dashboard state output to `dashboard/data/state.js`
- Runtime snapshot output to `runtime/last-run.json`

### Agents and Workflows

- Content pipeline workflow
- Lead qualification workflow
- Agent templates for research, ideation, scripting, qualification, and DM response
- Content pipeline is the active M1 workflow family
- Lead qualification remains in the repo as a disabled manual-only surface, not an active M1 runtime path
- Two sample tenant workspaces with instance-level configuration

### Automation

- GitHub Actions workflow for manual and scheduled runs
- Test coverage for orchestrator write path and contract validation

### Planning and Architecture

- Architecture boundary doc in `docs/architecture.md`
- Target product doc in `docs/target-state.md`
- Repo working brief in `codex.md`, now expanded with engineering standards, UI direction, and agent architecture rules
- Structured SOP library in `knowledge/sops/`
- SonarQube project config prepared in `sonar-project.properties`
- Parked database schema draft in `supabase/schema.sql`

## What Is Verified

- `node orchestrator/run.mjs`
- `node orchestrator/run.mjs --workspace=vbj-services`
- `node --test --test-isolation=none`
- syntax checks for `dashboard/app/**/*.js`
- syntax checks for `orchestrator/**/*.mjs`

## What Is Still Fake

- Executor handlers are simulated and deterministic
- No real model provider is connected
- No real backend API exists yet
- No database writes happen at runtime
- No authentication or tenant enforcement exists in the UI path
- No actual SonarQube scan is running yet because the repo has config only, not a wired scanner or server connection

## Folder Structure

This is the current structure we are keeping clean:

- `dashboard/`: static frontend and generated dashboard state
- `dashboard/app/`: modular dashboard source split by responsibility
- `orchestrator/`: runtime entrypoint and orchestration engine
- `knowledge/`: SOP and operational knowledge library
- `config/`: tenant and workflow instance configuration
- `docs/`: architecture, build status, and target-state documents
- `.github/workflows/`: always-on orchestration triggers
- `tests/`: runtime verification
- `supabase/`: deferred database groundwork, not active runtime code

## Immediate Next Build Steps

1. Replace the simulated executor adapter implementation with a real provider-backed adapter.
2. Turn the read-only template and instance surfaces into structured configuration forms.
3. Add a real backend contract for manual runs and saved instance configuration.
4. Keep the runtime file-backed until the workflow and UI surfaces stop changing aggressively.
