import { state, uiState } from "../context.js";
import { formatTriggerMode } from "../lib.js";
import {
  baseWorkflows,
  getAgentTemplateById,
  latestRunForWorkflow,
  matchesSearch
} from "./core.js";

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
        ? "Ready for the next run"
        : workflow.schedule
          ? `Waiting for ${workflow.schedule}`
          : "Waiting for first run",
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
    detail: workflow.schedule ? "Waiting for scheduled run" : "Waiting for manual run"
  };
}

export function matchesWorkflowActivity(workflow) {
  if (uiState.statusFilter === "all") {
    return true;
  }

  return getWorkflowActivity(workflow).state === uiState.statusFilter;
}

export function filteredWorkflows() {
  return baseWorkflows().filter((workflow) =>
    matchesWorkflowActivity(workflow) &&
    matchesSearch([
      workflow.name,
      workflow.workspaceId,
      workflow.templateName,
      workflow.description,
      workflow.triggerMode
    ])
  );
}

export function workflowTemplatesInScope() {
  const counts = new Map();

  filteredWorkflows().forEach((workflow) => {
    const entry = counts.get(workflow.templateId) ?? {
      instanceCount: 0,
      workspaces: new Set()
    };

    entry.instanceCount += 1;
    entry.workspaces.add(workflow.workspaceId);
    counts.set(workflow.templateId, entry);
  });

  return (state.workflowTemplates ?? [])
    .filter((template) => {
      const countEntry = counts.get(template.id);

      if (countEntry) {
        return true;
      }

      return matchesSearch([
        template.name,
        template.description,
        template.sopDirectory,
        ...template.supportedTriggerModes.map(formatTriggerMode),
        ...template.instanceConfigFields
      ]);
    })
    .map((template) => ({
      ...template,
      stepCount: template.steps.length,
      triggerModes: template.supportedTriggerModes.map(formatTriggerMode),
      instanceCount: counts.get(template.id)?.instanceCount ?? 0,
      workspaces: Array.from(counts.get(template.id)?.workspaces ?? [])
    }));
}

export function selectedWorkflowContext() {
  const workflow = baseWorkflows().find((entry) => entry.id === uiState.selectedWorkflowId) ?? null;

  if (!workflow) {
    return null;
  }

  const latestRun = latestRunForWorkflow(workflow.id);
  const workflowActivity = getWorkflowActivity(workflow, latestRun);
  const template = (state.workflowTemplates ?? []).find((entry) => entry.id === workflow.templateId) ?? null;
  const agents =
    workflow.agentChain?.map((node) => ({
      ...node,
      template: getAgentTemplateById(node.agentId)
    })) ?? [];

  return {
    workflow,
    latestRun,
    workflowActivity,
    template,
    agents
  };
}
