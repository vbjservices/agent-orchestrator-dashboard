import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { agentTemplates, getAgentTemplate, getWorkflowTemplate, workflowTemplates } from "./catalog.mjs";
import { executeStep } from "./executors.mjs";
import { defaultPaths } from "./paths.mjs";
import { loadState, writeState } from "./state-store.mjs";
import { validateContracts } from "./validation.mjs";
import { loadWorkspaces } from "./workspace-loader.mjs";

function parsePreviousRuns(previousState) {
  return Array.isArray(previousState?.runs) ? previousState.runs : [];
}

function toIsoDate(value) {
  return new Date(value).toISOString();
}

function buildLogLine(message, timestamp) {
  return `[${timestamp}] ${message}`;
}

async function executeWorkflowInstance({ workspace, workflowInstance, trigger, executionTime }) {
  const workflowTemplate = getWorkflowTemplate(workflowInstance.template);

  if (!workflowTemplate) {
    throw new Error(`Unknown workflow template: ${workflowInstance.template}`);
  }

  const runId = `run_${randomUUID()}`;
  const runStartedAt = toIsoDate(executionTime);
  const runLogs = [
    buildLogLine(`Workflow ${workflowInstance.name} started for ${workspace.name}.`, runStartedAt),
    buildLogLine(`Trigger source: ${trigger}.`, runStartedAt)
  ];
  const steps = [];
  const artifacts = {};
  let totalCost = 0;

  for (const templateStep of workflowTemplate.steps) {
    const stepStartedAt = new Date();
    const stepStartedAtIso = toIsoDate(stepStartedAt);
    const stepContext = {
      workspace,
      workflowInstance,
      workflowTemplate,
      artifacts
    };

    const result = await executeStep(templateStep, stepContext);
    totalCost += result.costUsd;
    artifacts[templateStep.id] = result.artifact;

    const stepFinishedAtIso = toIsoDate(new Date());
    const stepLogs = result.logs.map((entry) => buildLogLine(entry, stepFinishedAtIso));

    runLogs.push(
      buildLogLine(`${result.agentName} completed ${templateStep.name}.`, stepFinishedAtIso),
      ...stepLogs
    );

    steps.push({
      id: templateStep.id,
      name: templateStep.name,
      agentId: templateStep.agentId,
      agentName: result.agentName,
      executor: result.executor ?? templateStep.executor,
      status: "succeeded",
      startedAt: stepStartedAtIso,
      finishedAt: stepFinishedAtIso,
      summary: result.summary,
      artifact: result.artifact,
      logs: stepLogs
    });
  }

  const finishedAt = toIsoDate(new Date());
  const primaryArtifact = steps.at(-1)?.artifact ?? null;

  return {
    id: runId,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workflowInstanceId: workflowInstance.id,
    workflowTemplateId: workflowTemplate.id,
    workflowName: workflowInstance.name,
    trigger,
    status: "succeeded",
    startedAt: runStartedAt,
    finishedAt,
    costEstimateUsd: Number(totalCost.toFixed(2)),
    summary: steps.at(-1)?.summary ?? `${workflowInstance.name} completed successfully.`,
    primaryArtifact,
    steps,
    logs: runLogs
  };
}

function buildWorkflowView(workspaces, runs) {
  return workspaces.flatMap((workspace) =>
    workspace.workflowInstances.map((workflowInstance) => {
      const workflowTemplate = getWorkflowTemplate(workflowInstance.template);
      const latestRun = runs.find((run) => run.workflowInstanceId === workflowInstance.id) ?? null;

      return {
        id: workflowInstance.id,
        workspaceId: workspace.id,
        name: workflowInstance.name,
        templateId: workflowInstance.template,
        templateName: workflowTemplate?.name ?? workflowInstance.template,
        description: workflowTemplate?.description ?? "",
        enabled: workflowInstance.enabled,
        triggerMode: workflowInstance.triggerMode,
        schedule: workflowInstance.schedule,
        lastRunStatus: latestRun?.status ?? "idle",
        lastRunAt: latestRun?.finishedAt ?? null,
        stepCount: workflowTemplate?.steps.length ?? 0,
        agentChain:
          workflowTemplate?.steps.map((step) => ({
            id: step.id,
            name: step.name,
            agentId: step.agentId,
            agentName: getAgentTemplate(step.agentId)?.name ?? step.agentId
          })) ?? []
      };
    })
  );
}

function buildWorkspaceView(workspaces, workflows, runs) {
  return workspaces.map((workspace) => {
    const workspaceRuns = runs.filter((run) => run.workspaceId === workspace.id);
    const workspaceWorkflows = workflows.filter((workflow) => workflow.workspaceId === workspace.id);
    const successfulRuns = workspaceRuns.filter((run) => run.status === "succeeded").length;
    const successRate =
      workspaceRuns.length === 0 ? 0 : Math.round((successfulRuns / workspaceRuns.length) * 100);

    return {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      timezone: workspace.timezone,
      vertical: workspace.vertical,
      idealCustomerProfile: workspace.idealCustomerProfile,
      goals: workspace.goals,
      activeWorkflowCount: workspaceWorkflows.filter((workflow) => workflow.enabled).length,
      totalRuns: workspaceRuns.length,
      successRate,
      lastRunAt: workspaceRuns[0]?.finishedAt ?? null
    };
  });
}

function buildGlobalStats(workspaces, workflows, runs) {
  const totalCost = runs.reduce((sum, run) => sum + (run.costEstimateUsd ?? 0), 0);
  const succeeded = runs.filter((run) => run.status === "succeeded").length;

  return {
    workspaceCount: workspaces.length,
    workflowCount: workflows.length,
    runCount: runs.length,
    successRate: runs.length === 0 ? 0 : Math.round((succeeded / runs.length) * 100),
    totalCostEstimateUsd: Number(totalCost.toFixed(2))
  };
}

async function writeRuntimeSnapshot(runtimeDir, state) {
  await fs.mkdir(runtimeDir, { recursive: true });
  const lastRunPath = path.join(runtimeDir, "last-run.json");
  await fs.writeFile(lastRunPath, JSON.stringify(state.runs[0] ?? null, null, 2), "utf8");
}

export async function runOrchestrator(options = {}) {
  const paths = {
    ...defaultPaths,
    ...(options.paths ?? {})
  };
  const trigger = options.trigger ?? "manual";
  const targetWorkspaceId = options.workspaceId ?? null;
  const targetWorkflowId = options.workflowId ?? null;
  const workspaces = await loadWorkspaces(paths.workspaceConfigDir);
  const previousState = await loadState(paths.outputStatePath);
  validateContracts(workspaces);

  const selectedWorkspaces = targetWorkspaceId
    ? workspaces.filter((workspace) => workspace.id === targetWorkspaceId)
    : workspaces;

  if (targetWorkspaceId && selectedWorkspaces.length === 0) {
    throw new Error(`Workspace ${targetWorkspaceId} was not found.`);
  }

  const executionTime = new Date();
  const newRuns = [];

  for (const workspace of selectedWorkspaces) {
    for (const workflowInstance of workspace.workflowInstances.filter((entry) => entry.enabled)) {
      if (
        targetWorkflowId &&
        workflowInstance.id !== targetWorkflowId &&
        workflowInstance.template !== targetWorkflowId
      ) {
        continue;
      }

      const run = await executeWorkflowInstance({
        workspace,
        workflowInstance,
        trigger,
        executionTime
      });
      newRuns.push(run);
    }
  }

  const historicalRuns = parsePreviousRuns(previousState).filter(
    (run) => !newRuns.some((createdRun) => createdRun.id === run.id)
  );
  const runs = [...newRuns, ...historicalRuns]
    .sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt))
    .slice(0, 30);
  const workflows = buildWorkflowView(workspaces, runs);
  const workspaceView = buildWorkspaceView(workspaces, workflows, runs);

  const state = {
    generatedAt: toIsoDate(new Date()),
    mode: "file-backed-v1",
    trigger,
    stats: buildGlobalStats(workspaceView, workflows, runs),
    agents: agentTemplates,
    workflowTemplates: Object.values(workflowTemplates),
    workspaces: workspaceView,
    workflows,
    runs
  };

  await writeState(paths.outputStatePath, state);
  await writeRuntimeSnapshot(paths.runtimeDir, state);

  return {
    state,
    runs: newRuns
  };
}
