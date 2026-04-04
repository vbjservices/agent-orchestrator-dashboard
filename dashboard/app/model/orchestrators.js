import { state, uiState } from "../context.js";
import { baseRuns, baseWorkflows, matchesSearch } from "./core.js";

export function orchestratorsInScope() {
  const workflows = baseWorkflows();
  const manualWorkflows = workflows.filter((workflow) => workflow.triggerMode.includes("manual"));
  const scheduledWorkflows = workflows.filter(
    (workflow) => workflow.triggerMode.includes("schedule") && Boolean(workflow.schedule)
  );

  return [
    {
      id: "github-actions-dispatch",
      name: "GitHub Actions Manual Dispatch",
      state: manualWorkflows.some((workflow) => workflow.enabled) ? "running" : "stopped",
      detail:
        manualWorkflows.length > 0
          ? `${manualWorkflows.length} workflow instances can be manually dispatched from GitHub Actions`
          : "No manual dispatch routes are configured in scope",
      attachmentCount: manualWorkflows.length,
      setup: "Operators dispatch workflow instances through workflow_dispatch inputs in GitHub Actions.",
      surfaces: [".github/workflows/orchestrator.yml", ...manualWorkflows.map((workflow) => workflow.name)]
    },
    {
      id: "github-actions-schedule",
      name: "GitHub Actions Schedule Runner",
      state: scheduledWorkflows.some((workflow) => workflow.enabled) ? "running" : "stopped",
      detail:
        scheduledWorkflows.length > 0
          ? `${scheduledWorkflows.length} workflow instances are attached to cron schedules`
          : "No scheduled workflow instances are configured in scope",
      attachmentCount: scheduledWorkflows.length,
      setup: "Cron schedules are attached per workflow instance and executed by GitHub Actions.",
      surfaces: [".github/workflows/orchestrator.yml", ...scheduledWorkflows.map((workflow) => workflow.schedule ?? workflow.name)]
    },
    {
      id: "state-publisher",
      name: "File-backed State Publisher",
      state: state.mode === "file-backed-v1" ? "running" : "stopped",
      detail: `Runtime mode is ${state.mode} and publishes dashboard state snapshots from repository runs`,
      attachmentCount: baseRuns().length,
      setup: "State is written to dashboard/data/state.js and runtime/last-run.json until a backend exists.",
      surfaces: ["dashboard/data/state.js", "runtime/last-run.json"]
    }
  ];
}

export function filteredOrchestrators() {
  return orchestratorsInScope().filter((entry) => {
    const statusMatch = uiState.statusFilter === "all" || entry.state === uiState.statusFilter;
    const searchMatch = matchesSearch([entry.name, entry.detail, entry.setup, ...entry.surfaces]);
    return statusMatch && searchMatch;
  });
}
