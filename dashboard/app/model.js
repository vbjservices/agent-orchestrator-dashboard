import { state, uiState } from "./context.js";
import { normalize } from "./lib.js";

export function agentSelectionKey(workflowId, agentStepId) {
  return `${workflowId}::${agentStepId}`;
}

export function currentWorkspace() {
  return state.workspaces.find((workspace) => workspace.id === uiState.workspaceId) ?? null;
}

export function getWorkflowById(workflowId) {
  return state.workflows.find((workflow) => workflow.id === workflowId) ?? null;
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

export function getWorkflowActivity(workflow, latestRun = latestRunForWorkflow(workflow.id)) {
  if (!workflow.enabled) {
    return {
      state: "stopped",
      label: "Stopped",
      detail: "Workflow disabled",
      activeStepId: null
    };
  }

  if (workflow.lastRunStatus === "running") {
    const activeStep =
      latestRun?.steps.find((step) => step.status === "running") ??
      latestRun?.steps.find((step) => step.status === "queued") ??
      latestRun?.steps.at(0) ??
      null;

    return {
      state: "running",
      label: "Running",
      detail: activeStep ? `Working on ${activeStep.name}` : "Executing workflow",
      activeStepId: activeStep?.id ?? null
    };
  }

  if (workflow.lastRunStatus === "failed") {
    const blockedStep =
      latestRun?.steps.find((step) => step.status === "failed") ?? latestRun?.steps.at(-1) ?? null;

    return {
      state: "error",
      label: "Error",
      detail: blockedStep ? `Blocked on ${blockedStep.name}` : "Last run failed",
      activeStepId: blockedStep?.id ?? null
    };
  }

  return {
    state: "stopped",
    label: "Stopped",
    detail:
      latestRun
        ? "Ready for the next fire"
        : workflow.schedule
          ? `Waiting for ${workflow.schedule}`
          : "Waiting for first fire",
    activeStepId: null
  };
}

export function getAgentNodeStatus(workflow, node, latestRun, workflowActivity) {
  const templateChain = workflow.agentChain ?? [];
  const chainIndex = templateChain.findIndex((entry) => entry.id === node.id);
  const latestStep =
    latestRun?.steps.find((step) => step.id === node.id) ?? latestRun?.steps?.[chainIndex] ?? null;
  const latestSteps = latestRun?.steps ?? [];
  const runningIndex = latestSteps.findIndex((step) => step.status === "running");
  const failedIndex = latestSteps.findIndex((step) => step.status === "failed");

  if (!workflow.enabled) {
    return { state: "stopped", detail: "Workflow disabled" };
  }

  if (workflowActivity.state === "running") {
    if (latestStep?.status === "running" || node.id === workflowActivity.activeStepId) {
      return { state: "running", detail: `Working on ${node.name}` };
    }

    if (latestStep?.status === "succeeded") {
      return { state: "stopped", detail: `Finished ${node.name}` };
    }

    if (runningIndex !== -1 && chainIndex > runningIndex) {
      return {
        state: "stopped",
        detail: `Queued after ${latestSteps[runningIndex]?.name ?? "active step"}`
      };
    }
  }

  if (workflowActivity.state === "error") {
    if (latestStep?.status === "failed" || chainIndex === failedIndex) {
      return { state: "error", detail: `Blocked on ${node.name}` };
    }

    if (latestStep?.status === "succeeded") {
      return { state: "stopped", detail: `Finished ${node.name}` };
    }

    return { state: "stopped", detail: "Waiting for recovery" };
  }

  if (latestStep?.status === "succeeded") {
    return {
      state: "stopped",
      detail: latestRun ? `Last finished ${node.name}` : "Ready for first execution"
    };
  }

  return {
    state: "stopped",
    detail: workflow.schedule ? "Waiting for scheduled wake-up" : "Waiting for manual fire"
  };
}

export function matchesActivity(workflow) {
  if (uiState.statusFilter === "all") {
    return true;
  }

  return getWorkflowActivity(workflow).state === uiState.statusFilter;
}

export function matchesSearch(parts) {
  const search = normalize(uiState.searchQuery);

  if (!search) {
    return true;
  }

  return parts.some((part) => normalize(part).includes(search));
}

export function filteredRuns() {
  return baseRuns().filter((run) => {
    const workflow = getWorkflowById(run.workflowInstanceId);

    return (
      (workflow ? matchesActivity(workflow) : true) &&
      matchesSearch([run.workflowName, run.workspaceName, run.summary, run.trigger, run.workflowTemplateId])
    );
  });
}

export function filteredWorkflows() {
  return baseWorkflows().filter((workflow) =>
    matchesActivity(workflow) &&
    matchesSearch([
      workflow.name,
      workflow.workspaceId,
      workflow.templateName,
      workflow.description,
      workflow.triggerMode
    ])
  );
}

export function selectedRun() {
  const runs = filteredRuns();
  return runs.find((run) => run.id === uiState.runId) ?? runs[0] ?? null;
}

export function ensureSelectedRun() {
  const activeRun = selectedRun();
  uiState.runId = activeRun?.id ?? null;
}

export function defaultAgentSelection() {
  const workflow = filteredWorkflows()[0] ?? null;
  const agentNode = workflow?.agentChain?.[0] ?? null;

  if (!workflow || !agentNode) {
    return "";
  }

  return agentSelectionKey(workflow.id, agentNode.id);
}

export function selectedAgentContext() {
  const workflows = filteredWorkflows();

  for (const workflow of workflows) {
    for (const node of workflow.agentChain ?? []) {
      const key = agentSelectionKey(workflow.id, node.id);

      if (key === uiState.selectedAgentKey) {
        const latestRun = latestRunForWorkflow(workflow.id);
        const workflowActivity = getWorkflowActivity(workflow, latestRun);
        const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);
        const latestStep =
          latestRun?.steps.find((step) => step.id === node.id) ??
          latestRun?.steps?.[(workflow.agentChain ?? []).findIndex((entry) => entry.id === node.id)] ??
          null;

        return {
          workflow,
          node,
          latestRun,
          latestStep,
          workflowActivity,
          agentState,
          selectionKey: key
        };
      }
    }
  }

  return null;
}

export function ensureSelectedAgent() {
  if (selectedAgentContext()) {
    return;
  }

  uiState.selectedAgentKey = defaultAgentSelection();
}

export function copyCommandLabel(commandId) {
  return uiState.copyFeedback === commandId ? "Copied" : "Copy";
}
