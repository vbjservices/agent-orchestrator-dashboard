import { state, uiState } from "../context.js";
import { baseRuns, getWorkflowById, matchesSearch } from "./core.js";
import { contentPerformanceSnapshot } from "./performance.js";
import { contentPipelineBoard } from "./pipeline.js";
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

function contentActivityEvents(runs) {
  return runs.flatMap((run) =>
    run.steps
      .filter((step) =>
        matchesSearch([
          step.agentName,
          step.name,
          step.summary,
          run.workflowName,
          run.workspaceName,
          step.artifact?.kind
        ])
      )
      .map((step) => ({
        id: `${run.id}::${step.id}`,
        runId: run.id,
        actor: step.agentName,
        summary: step.summary,
        workflowName: run.workflowName,
        workspaceName: run.workspaceName,
        status: step.status,
        finishedAt: step.finishedAt
      }))
  );
}

function supplementalDashboardActivity(runs) {
  if (uiState.activeView !== "dashboard" || runs.length === 0) {
    return [];
  }

  const latestRun = runs[0];
  const generatedAt = state.generatedAt ? new Date(state.generatedAt) : new Date(latestRun.finishedAt);
  const pipeline = contentPipelineBoard();
  const performance = contentPerformanceSnapshot();
  const latestScriptTitle = latestRun.primaryArtifact?.selectedAngle?.title ?? latestRun.primaryArtifact?.headline ?? latestRun.workflowName;
  const totalPosts = performance.posts.length;

  const entries = [
    {
      id: `signal::editor::${latestRun.id}`,
      runId: latestRun.id,
      actor: "Editor",
      summary: `Review checkpoint staged for "${latestScriptTitle}" before it moves beyond scripting.`,
      workflowName: latestRun.workflowName,
      workspaceName: latestRun.workspaceName,
      status: "succeeded",
      finishedAt: new Date(generatedAt.getTime() - 1_000).toISOString()
    },
    {
      id: `signal::scheduler::${latestRun.id}`,
      runId: latestRun.id,
      actor: "Scheduler",
      summary: `Scheduling backlog prepared for ${totalPosts} simulated platform posts from the current script output.`,
      workflowName: "Content Performance",
      workspaceName: latestRun.workspaceName,
      status: "running",
      finishedAt: new Date(generatedAt.getTime() - 2_000).toISOString()
    },
    {
      id: `signal::analytics::${latestRun.id}`,
      runId: latestRun.id,
      actor: "Analytics",
      summary: `Performance snapshot refreshed across TikTok, Instagram, and YouTube with ${pipeline.total} roadmap items in view.`,
      workflowName: "Content Performance",
      workspaceName: latestRun.workspaceName,
      status: "succeeded",
      finishedAt: new Date(generatedAt.getTime() - 3_000).toISOString()
    }
  ];

  return entries.filter((entry) =>
    matchesSearch([entry.actor, entry.summary, entry.workflowName, entry.workspaceName])
  );
}

export function activityEntries() {
  const runs = filteredRuns();

  return [...supplementalDashboardActivity(runs), ...contentActivityEvents(runs)]
    .sort((left, right) => new Date(right.finishedAt) - new Date(left.finishedAt))
    .slice(0, 30);
}

export function selectedRun() {
  const runs = filteredRuns();
  return runs.find((run) => run.id === uiState.runId) ?? runs[0] ?? null;
}

export function ensureSelectedRun() {
  const activeRun = selectedRun();
  uiState.runId = activeRun?.id ?? null;
}
