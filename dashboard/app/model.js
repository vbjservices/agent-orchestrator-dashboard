import { state, uiState } from "./context.js";
import { normalize } from "./lib.js";

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

function aggregateState(states) {
  if (states.includes("error")) {
    return "error";
  }

  if (states.includes("running")) {
    return "running";
  }

  return "stopped";
}

export function workflowTemplatesInScope() {
  const templates = new Map();

  filteredWorkflows().forEach((workflow) => {
    const entry = templates.get(workflow.templateId) ?? {
      id: workflow.templateId,
      name: workflow.templateName,
      description: workflow.description,
      instanceCount: 0,
      stepCount: workflow.stepCount,
      triggerModes: new Set(),
      workspaces: new Set()
    };

    entry.instanceCount += 1;
    entry.stepCount = Math.max(entry.stepCount, workflow.stepCount ?? 0);
    entry.triggerModes.add(workflow.triggerMode.replaceAll("_", " / "));
    entry.workspaces.add(workflow.workspaceId);
    templates.set(workflow.templateId, entry);
  });

  return Array.from(templates.values()).map((entry) => ({
    ...entry,
    triggerModes: Array.from(entry.triggerModes),
    workspaces: Array.from(entry.workspaces)
  }));
}

export function agentInstancesInScope() {
  const instances = new Map();

  baseWorkflows().forEach((workflow) => {
    const latestRun = latestRunForWorkflow(workflow.id);
    const workflowActivity = getWorkflowActivity(workflow, latestRun);
    const workspace = getWorkspaceById(workflow.workspaceId);

    (workflow.agentChain ?? []).forEach((node) => {
      const template = getAgentTemplateById(node.agentId);
      const bindingState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);
      const instanceKey = `${workflow.workspaceId}::${node.agentId}`;
      const entry = instances.get(instanceKey) ?? {
        id: instanceKey,
        workspaceId: workflow.workspaceId,
        workspaceName: workspace?.name ?? workflow.workspaceId,
        agentId: node.agentId,
        agentName: node.agentName,
        category: template?.category ?? "uncategorized",
        responsibility: template?.responsibility ?? "No responsibility set yet.",
        bindings: []
      };

      entry.bindings.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        stepId: node.id,
        stepName: node.name,
        selectionKey: agentSelectionKey(workflow.id, node.id),
        triggerMode: workflow.triggerMode,
        schedule: workflow.schedule,
        enabled: workflow.enabled,
        state: bindingState.state,
        detail: bindingState.detail
      });
      instances.set(instanceKey, entry);
    });
  });

  return Array.from(instances.values())
    .map((entry) => {
      const states = entry.bindings.map((binding) => binding.state);
      const state = aggregateState(states);
      const primaryBinding =
        entry.bindings.find((binding) => binding.state === "error") ??
        entry.bindings.find((binding) => binding.state === "running") ??
        entry.bindings.at(0);

      return {
        ...entry,
        state,
        activeWorkflowCount: entry.bindings.filter((binding) => binding.enabled).length,
        workflowCount: entry.bindings.length,
        primarySelectionKey: primaryBinding?.selectionKey ?? "",
        detail: primaryBinding?.detail ?? "No activity recorded yet."
      };
    });
}

export function filteredAgentInstances() {
  return agentInstancesInScope()
    .filter((entry) => {
      const statusMatch = uiState.statusFilter === "all" || entry.state === uiState.statusFilter;
      const searchMatch = matchesSearch([
        entry.agentName,
        entry.workspaceId,
        entry.workspaceName,
        entry.category,
        entry.responsibility,
        ...entry.bindings.flatMap((binding) => [binding.workflowName, binding.stepName, binding.triggerMode])
      ]);

      return statusMatch && searchMatch;
    });
}

export function agentTemplatesInScope() {
  const counts = new Map();

  filteredAgentInstances().forEach((instance) => {
    const entry = counts.get(instance.agentId) ?? {
      instanceCount: 0,
      workspaces: new Set()
    };

    entry.instanceCount += 1;
    entry.workspaces.add(instance.workspaceId);
    counts.set(instance.agentId, entry);
  });

  return state.agents.filter((agent) => {
    const countEntry = counts.get(agent.id);

    if (countEntry) {
      return true;
    }

    return matchesSearch([agent.name, agent.category, agent.responsibility]);
  }).map((agent) => ({
    ...agent,
    instanceCount: counts.get(agent.id)?.instanceCount ?? 0,
    workspaceCount: counts.get(agent.id)?.workspaces.size ?? 0
  }));
}

export function orchestratorsInScope() {
  const workflows = baseWorkflows();
  const manualWorkflows = workflows.filter((workflow) => workflow.triggerMode.includes("manual"));
  const scheduledWorkflows = workflows.filter((workflow) => Boolean(workflow.schedule));
  const webhookWorkflows = workflows.filter((workflow) => workflow.triggerMode.includes("webhook"));
  const orchestrators = [
    {
      id: "manual-dispatch",
      name: "Manual Dispatch",
      state: manualWorkflows.some((workflow) => workflow.enabled) ? "running" : "stopped",
      detail:
        manualWorkflows.length > 0
          ? `${manualWorkflows.length} workflow instances can be fired by an operator`
          : "No manual routes are configured in scope",
      attachmentCount: manualWorkflows.length,
      setup: "Manual triggers are attached at the workflow-instance level.",
      surfaces: manualWorkflows.map((workflow) => workflow.name)
    },
    {
      id: "schedule-runner",
      name: "Schedule Runner",
      state: scheduledWorkflows.some((workflow) => workflow.enabled) ? "running" : "stopped",
      detail:
        scheduledWorkflows.length > 0
          ? `${scheduledWorkflows.length} workflow instances are wired to schedules`
          : "No scheduled routes are configured in scope",
      attachmentCount: scheduledWorkflows.length,
      setup: "Schedules are configured per workflow instance, not inside the agent.",
      surfaces: scheduledWorkflows.map((workflow) => workflow.schedule ?? workflow.name)
    },
    {
      id: "webhook-ingress",
      name: "Webhook Ingress",
      state: webhookWorkflows.some((workflow) => workflow.enabled) ? "running" : "stopped",
      detail:
        webhookWorkflows.length > 0
          ? `${webhookWorkflows.length} workflow instances are ready for inbound webhook activation`
          : "No webhook routes are configured in scope",
      attachmentCount: webhookWorkflows.length,
      setup: "Webhook activation belongs to the workflow instance boundary.",
      surfaces: webhookWorkflows.map((workflow) => workflow.name)
    },
    {
      id: "state-publisher",
      name: "State Publisher",
      state: state.mode === "file-backed-v1" ? "running" : "stopped",
      detail: `Runtime mode is ${state.mode} and publishes state snapshots for the control plane`,
      attachmentCount: baseRuns().length,
      setup: "The current runtime writes state to disk instead of a database.",
      surfaces: ["dashboard/data/state.js", "runtime/last-run.json"]
    }
  ];

  return orchestrators;
}

export function filteredOrchestrators() {
  return orchestratorsInScope().filter((entry) => {
    const statusMatch = uiState.statusFilter === "all" || entry.state === uiState.statusFilter;
    const searchMatch = matchesSearch([entry.name, entry.detail, entry.setup, ...entry.surfaces]);
    return statusMatch && searchMatch;
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

export function selectedWorkflowContext() {
  const workflow = baseWorkflows().find((entry) => entry.id === uiState.selectedWorkflowId) ?? null;

  if (!workflow) {
    return null;
  }

  const latestRun = latestRunForWorkflow(workflow.id);
  const workflowActivity = getWorkflowActivity(workflow, latestRun);

  return {
    workflow,
    latestRun,
    workflowActivity
  };
}

export function selectedAgentContext() {
  const workflows = baseWorkflows();

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

export function copyCommandLabel(commandId) {
  return uiState.copyFeedback === commandId ? "Copied" : "Copy";
}
