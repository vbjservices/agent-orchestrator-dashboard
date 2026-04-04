import { currency } from "../lib.js";
import { state } from "../context.js";
import { filteredAgentInstances } from "./agents.js";
import { dashboardAiTeams } from "./dashboard.js";
import { currentWorkspace } from "./core.js";
import { contentPerformanceSnapshot } from "./performance.js";
import { contentPipelineBoard } from "./pipeline.js";
import { filteredRuns } from "./runs.js";
import { taskAgentStatusCards } from "./tasks.js";
import { filteredWorkflows, getWorkflowActivity } from "./workflows.js";

function compactNumber(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  return String(value);
}

function percent(value, digits = 0) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function shortStamp(value) {
  if (!value) {
    return "n/a";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.day} ${values.month} ${values.hour}:${values.minute}`;
}

function durationSeconds(run) {
  if (!run.startedAt || !run.finishedAt) {
    return 0;
  }

  return Math.max(Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000), 0);
}

function summaryCards({ runs, workflows, agents, performance, pipeline }) {
  const runningWorkflows = workflows.filter((workflow) => getWorkflowActivity(workflow).state === "running").length;
  const totalReach = sum(performance.platforms.map((platform) => platform.totalViews));

  return [
    {
      tone: "cyan",
      label: "Runs in scope",
      value: compactNumber(runs.length),
      meta: `${runningWorkflows} workflows running right now`
    },
    {
      tone: "violet",
      label: "Visible agents",
      value: compactNumber(agents.length),
      meta: `${dashboardAiTeams().length} content agents in the active chain`
    },
    {
      tone: "pink",
      label: "Pipeline items",
      value: compactNumber(pipeline.total),
      meta: `${pipeline.counts.find((stage) => stage.id === "scripted")?.count ?? 0} items already scripted`
    },
    {
      tone: "green",
      label: "Estimated reach",
      value: compactNumber(totalReach),
      meta: `${performance.platforms.length} platforms tracked in performance view`
    }
  ];
}

function executionPulse(runs) {
  const series = [...runs].slice(0, 8).reverse();
  const durations = series.map(durationSeconds);
  const costs = series.map((run) => Number(run.costEstimateUsd ?? 0));
  const steps = series.map((run) => run.steps?.length ?? 0);

  return {
    labels: series.map((run) => shortStamp(run.finishedAt)),
    durations,
    steps,
    costs,
    averageDurationLabel: `${Math.round(average(durations)) || 0}s avg`,
    totalCostLabel: currency(sum(costs)),
    totalStepsLabel: `${sum(steps)} steps`,
    latestRunLabel: series.at(-1)?.workflowName ?? "No runs in scope"
  };
}

function workflowMix(workflows, runs) {
  const counts = { running: 0, stopped: 0, error: 0 };

  workflows.forEach((workflow) => {
    counts[getWorkflowActivity(workflow).state] += 1;
  });

  const successfulRuns = runs.filter((run) => run.status === "succeeded").length;

  return [
    {
      label: "Running",
      tone: "cyan",
      value: counts.running,
      total: workflows.length
    },
    {
      label: "Stopped",
      tone: "violet",
      value: counts.stopped,
      total: workflows.length
    },
    {
      label: "Error",
      tone: "pink",
      value: counts.error,
      total: workflows.length
    },
    {
      label: "Success",
      tone: "green",
      value: successfulRuns,
      total: runs.length || 1
    }
  ];
}

function platformSignals(performance) {
  const totalViews = sum(performance.platforms.map((platform) => platform.totalViews));
  const averageEngagement = average(performance.platforms.map((platform) => platform.averageEngagement));

  return {
    headline: `${compactNumber(totalViews)} views`,
    subline: `${percent(averageEngagement, 1)} avg engagement across platform outputs`,
    platforms: performance.platforms.map((platform) => ({
      id: platform.id,
      label: platform.label,
      tone: platform.tone,
      stat: platform.totalViewsLabel,
      meta: `${platform.contentVolume} outputs / ${platform.averageEngagementLabel} eng.`,
      series: platform.sparkline.length ? platform.sparkline : [0, 0, 0, 0]
    }))
  };
}

function pipelineSignals(pipeline) {
  return pipeline.counts.map((stage) => ({
    id: stage.id,
    label: stage.label,
    tone: stage.tone,
    value: stage.count
  }));
}

function workspaceThroughput(runs) {
  const workspaces =
    currentWorkspace() !== null ? [currentWorkspace()] : state.workspaces;

  return workspaces
    .map((workspace) => {
      const workspaceRuns = runs.filter((run) => run.workspaceId === workspace.id);
      const succeeded = workspaceRuns.filter((run) => run.status === "succeeded").length;
      const totalCost = sum(workspaceRuns.map((run) => Number(run.costEstimateUsd ?? 0)));

      return {
        id: workspace.id,
        name: workspace.name,
        runCount: workspaceRuns.length,
        successRate: workspaceRuns.length ? Math.round((succeeded / workspaceRuns.length) * 100) : 0,
        totalCostLabel: currency(totalCost),
        description: workspace.description ?? "No workspace description"
      };
    })
    .sort((left, right) => right.runCount - left.runCount || left.name.localeCompare(right.name));
}

function agentLoad() {
  return taskAgentStatusCards()
    .slice(0, 6)
    .map((entry) => ({
      id: entry.agentId,
      name: entry.agentName,
      category: entry.category,
      progress: entry.progress,
      totalTasks: entry.total,
      state: entry.state,
      nextTaskTitle: entry.nextTaskTitle
    }));
}

function spotlightNotes({ execution, performance, pipeline, workspaces }) {
  const bestPlatform = [...performance.platforms].sort((left, right) => right.totalViews - left.totalViews)[0] ?? null;
  const busiestWorkspace = workspaces[0] ?? null;

  return [
    {
      tone: "cyan",
      label: "Runtime pulse",
      text: `${execution.latestRunLabel} is the latest completed execution in the current scope.`
    },
    {
      tone: "violet",
      label: "Pipeline pressure",
      text: `${pipeline.find((stage) => stage.id === "ideas")?.value ?? 0} items are still sitting in ideation and need conversion pressure.`
    },
    {
      tone: "pink",
      label: "Audience signal",
      text: bestPlatform
        ? `${bestPlatform.label} currently leads visibility at ${bestPlatform.totalViewsLabel} simulated views.`
        : "No platform signal exists yet."
    },
    {
      tone: "green",
      label: "Workspace leader",
      text: busiestWorkspace
        ? `${busiestWorkspace.name} has the highest execution volume at ${busiestWorkspace.runCount} runs.`
        : "No workspace activity is visible yet."
    }
  ];
}

export function kpiSnapshot() {
  const runs = filteredRuns();
  const workflows = filteredWorkflows();
  const agents = filteredAgentInstances();
  const performance = contentPerformanceSnapshot();
  const pipeline = contentPipelineBoard();
  const execution = executionPulse(runs);
  const workspaces = workspaceThroughput(runs);

  return {
    cards: summaryCards({ runs, workflows, agents, performance, pipeline }),
    execution,
    workflowMix: workflowMix(workflows, runs),
    platformSignals: platformSignals(performance),
    pipelineSignals: pipelineSignals(pipeline),
    workspaceThroughput: workspaces,
    agentLoad: agentLoad(),
    spotlightNotes: spotlightNotes({
      execution,
      performance,
      pipeline: pipeline.counts,
      workspaces
    })
  };
}
