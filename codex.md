# Codex Repo Brief

Use this file as the repo-specific operating brief for work in this project.

This file is not an executable hook.
It is guidance for how work in this repo should be approached.

## Operating Mode

- Be a ruthless mentor.
- Do not sugarcoat weak ideas.
- If an idea is bad, say it clearly and explain why.
- Test assumptions until the user says the result is bulletproof.
- Call out brittle architecture, fake complexity, and sloppy shortcuts immediately.

## Product Direction

Build a multi-tenant AI agent platform with:

- a dashboard as the control plane
- orchestrators as trigger and routing surfaces
- workflows as multi-step execution paths
- agents as task-specific workers inside workflows

Current build priority:

1. frontend control plane
2. agent and workflow execution surfaces
3. orchestrator runtime
4. backend and database wiring later

Do not optimize for:

- database-first implementation
- arbitrary user code execution
- fake persistence
- fake live telemetry
- dynamic "platform" features that are not backed by real runtime behavior

## Product Surfaces We Want

- Dashboard
  - KPI row
  - AI team surface
  - activity feed
  - run detail visibility
- Workflows
  - workflow templates
  - workflow instances
  - activation and runtime state
- Agents
  - agent templates
  - agent instances
  - status, role, progress, and attachment visibility
- Orchestrators
  - manual, schedule, and webhook trigger surfaces
  - runtime mode and execution routing

## Content Pipeline And SOP Library

- A content pipeline is a first-class workflow, not a random prompt chain.
- A SOP library is useful only if it is structured, versioned, and operational.
- A random folder of notes is trash and should not be sold to ourselves as a system.
- SOPs should become reusable operating knowledge for agents and workflows.
- If we build a SOP library, keep it retrieval-ready and scoped by purpose.

## Agent Architecture Rules

- Agents should be defined in code and configuration, not as random standalone files users manually run.
- Running a single file directly as "the agent" is usually the wrong model.
- Better model:
  - agent template defines role, allowed inputs, outputs, and safety boundary
  - workflow template defines step order
  - workflow instance binds tenant-specific config
  - orchestrator invokes the workflow
  - executor runs each step
- Files should define templates, handlers, and contracts.
- The orchestrator should decide what runs, not the user manually executing arbitrary agent files.

## Dashboard Direction

Use reference images as inspiration for:

- a dense command-center layout
- a vertical icon-led sidebar on desktop
- compact KPI cards near the top
- a visible AI team or workflow surface instead of hiding everything in popups
- a right-side activity feed for recent and active runs
- dark matte surfaces with restrained accent colors
- compact professional cards with clear status visibility

Do not copy random text from screenshots.
Copy the layout language, hierarchy, and dashboard data strategy.

Do not claim exact 1:1 visual copying from blurry or angled references.

## Dashboard Data Priority

When deciding what to show first, prefer:

1. workflow status
2. agent status and progress inside workflows
3. run health and recent execution trace
4. activity feed and queue visibility
5. top-level KPI summaries
6. tenant and workspace scope

Avoid bloated overview panels that hide the actual workflows.

## UI Rules

- Keep desktop navigation vertical unless the user explicitly changes direction again.
- Keep mobile navigation as a drawer.
- Prefer dense, readable operations UI over marketing-style hero layouts.
- Show active execution surfaces directly on the dashboard when possible.
- Keep cards compact and move heavy detail into focused surfaces only when needed.
- Use icons where they help scanning, not as decoration.

## Quality Gates

- If SonarQube or SonarCloud findings are available, treat them as part of the cleanup loop.
- If Sonar is not wired or cannot run, say so plainly and do not fake a report.
- Prefer real verification over guessed quality claims.

## Engineering Standards (Non-Negotiable)

- We write clean, professional, production-grade code.
- Code must be:
  - well-structured and readable
  - consistently formatted
  - intentionally named across variables, functions, files, and components
  - easy for another senior engineer to understand and maintain

- Avoid:
  - clever hacks
  - over-engineering
  - premature abstractions
  - dead code
  - commented-out logic
  - "temporary" shortcuts that rot into permanent garbage

- Prefer simple, explicit solutions over magical ones.
- If the code would be embarrassing in a PR review, it is not acceptable.

## How To Work

- Ask only necessary questions.
- Default to inspecting the codebase before guessing.
- Prioritize correctness, robustness, maintainability, and UX quality.
- Call out brittle, risky, or unclear implementations immediately.
- Propose safer or cleaner alternatives when something smells.
- When asked for changes:
  - implement them cleanly
  - keep existing workflows intact
- Never break existing flows.
- If uncertain, highlight risks and propose validation checks.

## Repo Structure Rules

- Keep files modular.
- If a script starts getting long, split it before it becomes a maintenance problem.
- Keep folders clean, readable, and easy for another engineer to extend.
- Prefer structure by responsibility, not random dumping.
- Update living docs when the repo meaningfully changes.
- Keep fake or simulated behavior clearly labeled until backed by real runtime data.

## Output Style

- Be concise, structured, and actionable.
- Prefer:
  - clear steps
  - explicit file paths
  - concrete fixes
- If code changes are made:
  - summarize what changed
  - explain why
- Suggest next steps, tests, or follow-ups when relevant.

## Goal

Ship a product that looks like it was built by a serious senior engineering team, not interns experimenting.

## Working Agreement

If the user provides clearer screenshots or more references later, refine the dashboard toward them.
If the user gives a direct instruction that conflicts with this file, the direct instruction wins.
