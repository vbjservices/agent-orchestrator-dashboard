import { uiState } from "../context.js";
import { baseRuns, getWorkflowById, matchesSearch } from "./core.js";
import { matchesWorkflowActivity } from "./workflows.js";

function matchesDashboardRunScope(run) {
  if (uiState.activeView !== "dashboard") {
    return true;
  }

  return run.workflowTemplateId === "content-pipeline";
}

export function filteredRuns() {
  return baseRuns().filter((run) => {
    const workflow = getWorkflowById(run.workflowInstanceId);

    return (
      matchesDashboardRunScope(run) &&
      (workflow ? matchesWorkflowActivity(workflow) : true) &&
      matchesSearch([run.workflowName, run.workspaceName, run.summary, run.trigger, run.workflowTemplateId])
    );
  });
}

export function selectedRun() {
  const runs = filteredRuns();
  return runs.find((run) => run.id === uiState.runId) ?? runs[0] ?? null;
}

export function ensureSelectedRun() {
  const activeRun = selectedRun();
  uiState.runId = activeRun?.id ?? null;
}
