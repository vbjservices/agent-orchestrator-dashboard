import { state, uiState } from "../context.js";
import {
  agentSelectionKey,
  aggregateState,
  baseWorkflows,
  getAgentTemplateById,
  getWorkspaceById,
  latestRunForWorkflow,
  matchesSearch
} from "./core.js";
import { getAgentNodeStatus, getWorkflowActivity } from "./workflows.js";

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
        sopPath: template?.sopPath ?? "",
        requiredInputs: template?.requiredInputs ?? [],
        outputArtifactKind: template?.outputArtifactKind ?? "unknown",
        allowedConfigFields: template?.allowedConfigFields ?? [],
        runtimeProfile: template?.defaultRuntimeProfile ?? null,
        bindings: []
      };

      entry.bindings.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        workflowTemplateId: workflow.templateId,
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

  return Array.from(instances.values()).map((entry) => {
    const states = entry.bindings.map((binding) => binding.state);
    const stateValue = aggregateState(states);
    const primaryBinding =
      entry.bindings.find((binding) => binding.state === "error") ??
      entry.bindings.find((binding) => binding.state === "running") ??
      entry.bindings.at(0);

    return {
      ...entry,
      state: stateValue,
      activeWorkflowCount: entry.bindings.filter((binding) => binding.enabled).length,
      workflowCount: entry.bindings.length,
      primarySelectionKey: primaryBinding?.selectionKey ?? "",
      detail: primaryBinding?.detail ?? "No activity recorded yet."
    };
  });
}

export function filteredAgentInstances() {
  return agentInstancesInScope().filter((entry) => {
    const statusMatch = uiState.statusFilter === "all" || entry.state === uiState.statusFilter;
    const searchMatch = matchesSearch([
      entry.agentName,
      entry.workspaceId,
      entry.workspaceName,
      entry.category,
      entry.responsibility,
      entry.sopPath,
      entry.outputArtifactKind,
      ...entry.requiredInputs,
      ...entry.allowedConfigFields,
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

  return state.agents
    .filter((agent) => {
      const countEntry = counts.get(agent.id);

      if (countEntry) {
        return true;
      }

      return matchesSearch([
        agent.name,
        agent.category,
        agent.responsibility,
        agent.sopPath,
        agent.outputArtifactKind,
        ...agent.requiredInputs,
        ...agent.allowedConfigFields
      ]);
    })
    .map((agent) => ({
      ...agent,
      instanceCount: counts.get(agent.id)?.instanceCount ?? 0,
      workspaceCount: counts.get(agent.id)?.workspaces.size ?? 0
    }));
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
        const template = getAgentTemplateById(node.agentId);

        return {
          workflow,
          node,
          latestRun,
          latestStep,
          workflowActivity,
          agentState,
          template,
          selectionKey: key
        };
      }
    }
  }

  return null;
}
