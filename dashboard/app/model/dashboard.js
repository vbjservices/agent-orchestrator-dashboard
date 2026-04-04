import { state } from "../context.js";
import { aggregateState } from "./core.js";
import { filteredAgentInstances } from "./agents.js";
import { filteredRuns } from "./runs.js";

const contentWorkflowTemplateId = "content-pipeline";

function sameDay(left, right) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function bindingProgress(binding) {
  if (binding.state === "error") {
    return 100;
  }

  if (binding.state === "running") {
    return 68;
  }

  if (binding.detail.includes("Finished") || binding.detail.includes("Last finished")) {
    return 100;
  }

  if (binding.detail.includes("Queued")) {
    return 18;
  }

  if (binding.detail.includes("Waiting") || binding.detail.includes("disabled")) {
    return 0;
  }

  return 42;
}

function contentAgentOrder() {
  const template = (state.workflowTemplates ?? []).find((entry) => entry.id === contentWorkflowTemplateId);
  return template?.steps.map((step) => step.agentId) ?? [];
}

export function dashboardMetrics() {
  const runs = filteredRuns();
  const runsToday = state.generatedAt
    ? runs.filter((run) => sameDay(new Date(run.finishedAt), new Date(state.generatedAt))).length
    : runs.length;
  const researchBriefs = runs.filter((run) => run.steps.some((step) => step.id === "research-signals")).length;
  const scriptsShipped = runs.filter((run) => run.primaryArtifact?.kind === "script").length;
  const successfulRuns = runs.filter((run) => run.status === "succeeded").length;
  const successRate = runs.length === 0 ? 0 : Math.round((successfulRuns / runs.length) * 100);

  return [
    ["research", "Research briefs", String(researchBriefs), "Content pipeline research outputs produced in scope"],
    ["runs", "Runs today", String(runsToday), "Content executions finished during the latest refresh cycle"],
    ["scripts", "Scripts shipped", String(scriptsShipped), "Draft scripts produced by the content pipeline"],
    ["success", "Success rate", `${successRate}%`, "Current content execution health percentage"]
  ];
}

export function dashboardAiTeams() {
  const grouped = new Map();
  const order = contentAgentOrder();

  filteredAgentInstances()
    .filter((instance) => instance.bindings.some((binding) => binding.workflowTemplateId === contentWorkflowTemplateId))
    .forEach((instance) => {
      const entry = grouped.get(instance.agentId) ?? {
        id: instance.agentId,
        name: instance.agentName,
        category: instance.category,
        responsibility: instance.responsibility,
        sopPath: instance.sopPath,
        outputArtifactKind: instance.outputArtifactKind,
        states: [],
        bindings: [],
        workflows: new Set(),
        workspaces: new Set()
      };

      const contentBindings = instance.bindings.filter(
        (binding) => binding.workflowTemplateId === contentWorkflowTemplateId
      );

      entry.states.push(instance.state);
      entry.workspaces.add(instance.workspaceName);

      contentBindings.forEach((binding) => {
        entry.bindings.push(binding);
        entry.workflows.add(binding.workflowName);
      });

      grouped.set(instance.agentId, entry);
    });

  return Array.from(grouped.values())
    .map((entry) => {
      const primaryBinding =
        entry.bindings.find((binding) => binding.state === "running") ??
        entry.bindings.find((binding) => binding.state === "error") ??
        entry.bindings.at(0);
      const progress =
        entry.bindings.length === 0
          ? 0
          : Math.round(entry.bindings.reduce((sum, binding) => sum + bindingProgress(binding), 0) / entry.bindings.length);

      return {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        responsibility: entry.responsibility,
        sopPath: entry.sopPath,
        outputArtifactKind: entry.outputArtifactKind,
        state: aggregateState(entry.states),
        progress,
        workflowCount: entry.workflows.size,
        workspaceCount: entry.workspaces.size,
        detail: primaryBinding?.detail ?? "No runtime activity recorded yet.",
        primarySelectionKey: primaryBinding?.selectionKey ?? ""
      };
    })
    .sort((left, right) => {
      const leftIndex = order.indexOf(left.id);
      const rightIndex = order.indexOf(right.id);
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    });
}
