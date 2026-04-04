import { matchesSearch, latestRunForWorkflow, getAgentTemplateById } from "./core.js";
import { filteredRuns } from "./runs.js";
import { filteredWorkflows, getAgentNodeStatus, getWorkflowActivity } from "./workflows.js";

function taskTitleForStep(stepName, workflowName) {
  const labels = {
    "Research Signals": `Collect research signals for ${workflowName}`,
    "Generate Angles": `Generate angles for ${workflowName}`,
    "Draft Script": `Draft script for ${workflowName}`,
    "Score Lead": `Score lead for ${workflowName}`,
    "Draft Response": `Draft response for ${workflowName}`,
    "Draft Reply": `Draft response for ${workflowName}`
  };

  return labels[stepName] ?? `${stepName} for ${workflowName}`;
}

function priorityLabel(order) {
  if (order === 1) {
    return "High";
  }

  if (order === 2) {
    return "Medium";
  }

  return "Low";
}

function priorityState(order) {
  if (order === 1) {
    return "high";
  }

  if (order === 2) {
    return "medium";
  }

  return "low";
}

function taskStatusForNode(workflow, node, latestRun, workflowActivity) {
  const chain = workflow.agentChain ?? [];
  const index = chain.findIndex((entry) => entry.id === node.id);
  const steps = latestRun?.steps ?? [];
  const runningIndex = steps.findIndex((step) => step.status === "running");
  const failedIndex = steps.findIndex((step) => step.status === "failed");
  const latestStep =
    steps.find((step) => step.id === node.id) ??
    (index !== -1 ? steps[index] : null);
  const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);

  if (workflowActivity.state === "running") {
    if (node.id === workflowActivity.activeStepId || latestStep?.status === "running") {
      return { label: "In Progress", state: "running", include: true, detail: agentState.detail };
    }

    if (runningIndex !== -1 && index < runningIndex && latestStep?.status === "succeeded") {
      return { label: "Done", state: "stopped", include: false, detail: `Finished ${node.name}` };
    }

    return { label: "Queued", state: "stopped", include: true, detail: agentState.detail };
  }

  if (workflowActivity.state === "error") {
    if (index === failedIndex || latestStep?.status === "failed") {
      return { label: "Blocked", state: "error", include: true, detail: agentState.detail };
    }

    if (failedIndex !== -1 && index < failedIndex && latestStep?.status === "succeeded") {
      return { label: "Done", state: "stopped", include: false, detail: `Finished ${node.name}` };
    }

    return { label: "Queued", state: "stopped", include: true, detail: "Waiting for recovery" };
  }

  return {
    label: workflow.enabled ? "Queued" : "Stopped",
    state: workflow.enabled ? "stopped" : "error",
    include: workflow.enabled,
    detail: workflow.enabled ? "Ready for the next execution cycle" : "Workflow disabled"
  };
}

export function prioritizedAgentTasks() {
  const tasks = filteredWorkflows()
    .filter((workflow) => workflow.enabled)
    .flatMap((workflow) => {
      const latestRun = latestRunForWorkflow(workflow.id);
      const workflowActivity = getWorkflowActivity(workflow, latestRun);

      return (workflow.agentChain ?? [])
        .map((node, index) => {
          const template = getAgentTemplateById(node.agentId);
          const taskStatus = taskStatusForNode(workflow, node, latestRun, workflowActivity);
          const order = index + 1;

          return {
            id: `${workflow.id}::${node.id}`,
            title: taskTitleForStep(node.name, workflow.name),
            workflowId: workflow.id,
            workflowName: workflow.name,
            workspaceId: workflow.workspaceId,
            agentId: node.agentId,
            agentName: node.agentName,
            category: template?.category ?? "uncategorized",
            stepId: node.id,
            stepName: node.name,
            order,
            priorityLabel: priorityLabel(order),
            priorityState: priorityState(order),
            statusLabel: taskStatus.label,
            state: taskStatus.state,
            include: taskStatus.include,
            detail: taskStatus.detail,
            selectionKey: `${workflow.id}::${node.id}`
          };
        })
        .filter((task) => task.include)
        .filter((task) =>
          matchesSearch([
            task.title,
            task.workflowName,
            task.workspaceId,
            task.agentName,
            task.category,
            task.stepName,
            task.detail
          ])
        );
    });

  return tasks.sort((left, right) => {
    const stateOrder = { running: 0, error: 1, stopped: 2 };
    const stateDelta = stateOrder[left.state] - stateOrder[right.state];

    if (stateDelta !== 0) {
      return stateDelta;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.workflowName.localeCompare(right.workflowName);
  });
}

export function taskAgentStatusCards() {
  const tasks = prioritizedAgentTasks();
  const grouped = new Map();

  tasks.forEach((task) => {
    const entry = grouped.get(task.agentId) ?? {
      agentId: task.agentId,
      agentName: task.agentName,
      category: task.category,
      runningCount: 0,
      queuedCount: 0,
      blockedCount: 0,
      tasks: []
    };

    if (task.state === "running") {
      entry.runningCount += 1;
    } else if (task.state === "error") {
      entry.blockedCount += 1;
    } else {
      entry.queuedCount += 1;
    }

    entry.tasks.push(task);
    grouped.set(task.agentId, entry);
  });

  return Array.from(grouped.values())
    .map((entry) => {
      const nextTask = entry.tasks[0] ?? null;
      const state = entry.runningCount > 0 ? "running" : entry.blockedCount > 0 ? "error" : "stopped";
      const total = entry.tasks.length;
      const progress = state === "running" ? 64 : state === "error" ? 100 : total > 0 ? 28 : 0;

      return {
        ...entry,
        state,
        total,
        progress,
        nextTaskTitle: nextTask?.title ?? "No queued work",
        nextTaskDetail: nextTask?.detail ?? "No active or queued tasks in scope.",
        orderedTasks: entry.tasks.slice(0, 4)
      };
    })
    .sort((left, right) => {
      const stateOrder = { running: 0, error: 1, stopped: 2 };
      const stateDelta = stateOrder[left.state] - stateOrder[right.state];

      if (stateDelta !== 0) {
        return stateDelta;
      }

      return left.agentName.localeCompare(right.agentName);
    });
}

export function taskActivityFeed() {
  const workflowIds = new Set(
    filteredWorkflows()
      .filter((workflow) => workflow.enabled)
      .map((workflow) => workflow.id)
  );

  return filteredRuns()
    .filter((run) => workflowIds.has(run.workflowInstanceId))
    .flatMap((run) =>
      run.steps.map((step) => ({
        id: `${run.id}::${step.id}`,
        agentName: step.agentName,
        workflowName: run.workflowName,
        workspaceName: run.workspaceName,
        summary: step.summary,
        status: step.status,
        finishedAt: step.finishedAt
      }))
    )
    .filter((entry) =>
      matchesSearch([entry.agentName, entry.summary, entry.workflowName, entry.workspaceName])
    )
    .sort((left, right) => new Date(right.finishedAt) - new Date(left.finishedAt))
    .slice(0, 16);
}
