import { state, uiState } from "../context.js";
import { normalize } from "../lib.js";

export function agentSelectionKey(workflowId, agentStepId) {
  return `${workflowId}::${agentStepId}`;
}

export function currentWorkspace() {
  return state.workspaces.find((workspace) => workspace.id === uiState.workspaceId) ?? null;
}

export function getWorkspaceById(workspaceId) {
  return state.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}

export function getWorkflowById(workflowId) {
  return state.workflows.find((workflow) => workflow.id === workflowId) ?? null;
}

export function getAgentTemplateById(agentId) {
  return state.agents.find((agent) => agent.id === agentId) ?? null;
}

export function baseRuns() {
  if (uiState.workspaceId === "all") {
    return state.runs;
  }

  return state.runs.filter((run) => run.workspaceId === uiState.workspaceId);
}

export function baseWorkflows() {
  if (uiState.workspaceId === "all") {
    return state.workflows;
  }

  return state.workflows.filter((workflow) => workflow.workspaceId === uiState.workspaceId);
}

export function latestRunForWorkflow(workflowId) {
  return state.runs.find((run) => run.workflowInstanceId === workflowId) ?? null;
}

export function aggregateState(states) {
  if (states.includes("error")) {
    return "error";
  }

  if (states.includes("running")) {
    return "running";
  }

  return "stopped";
}

export function matchesSearch(parts) {
  const search = normalize(uiState.searchQuery);

  if (!search) {
    return true;
  }

  return parts.some((part) => normalize(part).includes(search));
}
