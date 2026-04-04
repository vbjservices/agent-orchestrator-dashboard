import { state } from "../context.js";
import { matchesSearch } from "./core.js";
import { filteredWorkflows } from "./workflows.js";

const contentWorkflowTemplateId = "content-pipeline";

export const pipelineStages = [
  {
    id: "ideas",
    label: "Ideas",
    tone: "ideas",
    emptyMessage: "No runtime-backed ideas match the current scope."
  },
  {
    id: "scripted",
    label: "Scripted",
    tone: "scripted",
    emptyMessage: "No script drafts have been produced in scope."
  },
  {
    id: "editing",
    label: "Editing",
    tone: "editing",
    emptyMessage: "Editing is not tracked yet by the M1 runtime."
  },
  {
    id: "scheduled",
    label: "Scheduled",
    tone: "scheduled",
    emptyMessage: "Scheduling state is not tracked yet by the M1 runtime."
  },
  {
    id: "published",
    label: "Published",
    tone: "published",
    emptyMessage: "Published state is not tracked yet by the M1 runtime."
  }
];

function contentRunsFromState() {
  const workflows = filteredWorkflows().filter((workflow) => workflow.templateId === contentWorkflowTemplateId);
  const workflowIds = new Set(workflows.map((workflow) => workflow.id));

  return (state.runs ?? [])
    .filter((run) => run.workflowTemplateId === contentWorkflowTemplateId && workflowIds.has(run.workflowInstanceId));
}

function excerpt(value, length = 144) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length - 3).trimEnd()}...`;
}

function dedupeLatest(items) {
  const latest = new Map();

  items.forEach((item) => {
    const existing = latest.get(item.key);

    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      latest.set(item.key, item);
    }
  });

  return Array.from(latest.values()).sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

function ideaItems(runs) {
  return dedupeLatest(
    runs.flatMap((run) => {
      const ideaPack = run.steps.find((step) => step.id === "generate-angles")?.artifact?.ideas ?? [];

      return ideaPack.map((idea) => ({
        key: `ideas::${run.workflowInstanceId}::${run.workspaceId}::${idea.title}`,
        id: `ideas::${run.id}::${idea.title}`,
        stage: "ideas",
        title: idea.title,
        summary: idea.hook ?? idea.angle,
        detail: idea.angle,
        tags: [idea.cta, run.workspaceName].filter(Boolean),
        workflowName: run.workflowName,
        workflowInstanceId: run.workflowInstanceId,
        workspaceName: run.workspaceName,
        updatedAt: run.finishedAt
      }));
    }).filter((item) =>
      matchesSearch([item.title, item.summary, item.detail, item.workflowName, item.workspaceName, ...item.tags])
    )
  );
}

function scriptedItems(runs) {
  return dedupeLatest(
    runs.flatMap((run) => {
      const artifact =
        run.steps.find((step) => step.id === "draft-script")?.artifact ??
        (run.primaryArtifact?.kind === "script" ? run.primaryArtifact : null);

      if (!artifact) {
        return [];
      }

      const title = artifact.selectedAngle?.title ?? artifact.headline ?? "Script draft";
      const summary = artifact.selectedAngle?.hook ?? excerpt(artifact.script, 148);
      const detail = artifact.script ?? artifact.headline ?? "Structured script artifact available.";

      return [
        {
          key: `scripted::${run.workflowInstanceId}::${run.workspaceId}::${title}`,
          id: `scripted::${run.id}::${title}`,
          stage: "scripted",
          title,
          summary,
          detail,
          tags: [artifact.selectedAngle?.cta, "Script draft", run.workspaceName].filter(Boolean),
          workflowName: run.workflowName,
          workflowInstanceId: run.workflowInstanceId,
          workspaceName: run.workspaceName,
          updatedAt: run.finishedAt
        }
      ];
    }).filter((item) =>
      matchesSearch([item.title, item.summary, item.detail, item.workflowName, item.workspaceName, ...item.tags])
    )
  );
}

export function contentPipelineBoard() {
  const runs = contentRunsFromState();
  const stageItems = {
    ideas: ideaItems(runs),
    scripted: scriptedItems(runs),
    editing: [],
    scheduled: [],
    published: []
  };

  const counts = pipelineStages.map((stage) => ({
    ...stage,
    count: stageItems[stage.id].length
  }));

  return {
    total: counts.reduce((sum, stage) => sum + stage.count, 0),
    counts,
    lanes: pipelineStages.map((stage) => ({
      ...stage,
      count: stageItems[stage.id].length,
      items: stageItems[stage.id]
    }))
  };
}
