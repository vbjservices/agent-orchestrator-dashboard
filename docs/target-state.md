# Target State

This file describes the product we are building toward, not what already exists.

Last updated:
- 2026-04-01

## Product Goal

Build a multi-tenant AI agent platform where operators can configure, trigger, observe, and govern tenant-specific workflows without turning the product into a vague pile of prompts and dashboards.

## Core Product Shape

The system should eventually have four clear layers:

- Dashboard: control plane for operators and tenants
- Orchestrator: trigger, routing, retries, and workflow lifecycle
- Agents and workflows: reusable task templates and tenant-specific instances
- Execution layer: model adapters, scripts, and external tool actions

Codex is part of the execution layer. It is not the platform.

## What The Product Must Support

### Tenant model

- Workspaces as the tenant boundary
- Workspace-specific workflow instances
- Workspace-specific agent instances and configuration
- Strict isolation of state, usage, and secrets

### Workflow model

- Reusable workflow templates
- Tenant-specific workflow instances
- Manual triggers
- Scheduled triggers
- Webhook or API triggers
- Ordered multi-step execution with step-level visibility

### Dashboard requirements

- Workflow overview
- Run history
- Detailed logs and artifacts
- Manual run controls
- Config surface for instances
- Clear status, failures, and retries

### Runtime requirements

- Always-on execution in the cloud
- Queue-safe orchestration
- Retry handling
- Cancellation support
- Observable run and step lifecycle

### Security requirements

- Secrets never exposed to the frontend
- Server-side execution only
- Role-based workspace access
- Auditability for critical actions

## Delivery Strategy

We are not building the full platform in one shot. That would be sloppy.

The current staged approach is:

1. Frontend control plane and code-first orchestrator
2. Real executor adapter boundary and better operational UX
3. Manual trigger flow with a proper backend contract
4. Database integration once the runtime shape is stable
5. Auth, governance, budgets, and deeper platform controls

## Product Standards

The build should stay:

- multi-tenant by design, not patched in later
- explicit about boundaries between UI, orchestration, and execution
- production-ready in folder structure and naming
- honest about what is real versus simulated
- testable at the runtime layer before expanding scope

## Things We Should Not Do Early

- Let users upload arbitrary code
- Push secrets into the browser
- Build a fake workflow builder before the runtime contract is stable
- Spend time on billing before execution is trustworthy
- Add database complexity before the operator and agent loop is proven
