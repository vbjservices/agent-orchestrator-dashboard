import { state } from "../context.js";
import { matchesSearch } from "./core.js";
import { filteredWorkflows } from "./workflows.js";

const contentWorkflowTemplateId = "content-pipeline";

const platformSets = [
  ["tt", "ig"],
  ["tt"],
  ["ig"],
  ["yt"],
  ["tt", "yt"],
  ["ig", "yt"]
];

function hash(value) {
  return Array.from(String(value ?? "")).reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 13), 0);
}

function excerpt(value, length = 128) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length - 3).trimEnd()}...`;
}

function contentResearchWorkflows() {
  return filteredWorkflows().filter((workflow) => workflow.templateId === contentWorkflowTemplateId);
}

function contentResearchRuns() {
  const workflowIds = new Set(contentResearchWorkflows().map((workflow) => workflow.id));

  return (state.runs ?? []).filter(
    (run) => run.workflowTemplateId === contentWorkflowTemplateId && workflowIds.has(run.workflowInstanceId)
  );
}

function workspaceMap() {
  return new Map((state.workspaces ?? []).map((workspace) => [workspace.id, workspace]));
}

function platformLabels(seed) {
  return platformSets[seed % platformSets.length];
}

function potentialForIndex(index, seed) {
  if (index === 0 || seed % 5 === 0) {
    return { label: "High", state: "high" };
  }

  if (index === 1 || seed % 3 === 0) {
    return { label: "Medium", state: "medium" };
  }

  return { label: "Low", state: "low" };
}

function derivedTopics(runs) {
  const latest = new Map();

  runs.forEach((run) => {
    const researchArtifact = run.steps.find((step) => step.id === "research-signals")?.artifact ?? null;
    const ideas = run.steps.find((step) => step.id === "generate-angles")?.artifact?.ideas ?? [];

    ideas.forEach((idea, index) => {
      const sourceSignal = researchArtifact?.bullets?.[index % Math.max(researchArtifact?.bullets?.length ?? 1, 1)] ?? "";
      const seed = hash(`${run.id}|${idea.title}|${run.workspaceId}|${index}`);
      const potential = potentialForIndex(index, seed);
      const topic = {
        id: `research-topic::${run.id}::${index}`,
        key: `${run.workflowInstanceId}::${idea.title}`,
        title: idea.title,
        hookAngle: idea.hook ?? idea.angle,
        sourceSignal,
        workflowId: run.workflowInstanceId,
        workflowName: run.workflowName,
        workspaceId: run.workspaceId,
        workspaceName: run.workspaceName,
        platforms: platformLabels(seed),
        potentialLabel: potential.label,
        potentialState: potential.state,
        updatedAt: run.finishedAt
      };

      const existing = latest.get(topic.key);

      if (!existing || new Date(topic.updatedAt) > new Date(existing.updatedAt)) {
        latest.set(topic.key, topic);
      }
    });
  });

  return Array.from(latest.values())
    .filter((topic) =>
      matchesSearch([
        topic.title,
        topic.hookAngle,
        topic.sourceSignal,
        topic.workflowName,
        topic.workspaceName,
        ...topic.platforms
      ])
    )
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

function competitorCardsFromTopics(topics) {
  const workspaces = workspaceMap();
  const cards = [];

  contentResearchWorkflows().forEach((workflow) => {
    const workspace = workspaces.get(workflow.workspaceId);
    const competitors = workspace?.competitors ?? [];
    const workspaceTopics = topics.filter((topic) => topic.workspaceId === workflow.workspaceId);

    competitors.forEach((competitor, index) => {
      const seed = hash(`${workflow.workspaceId}|${competitor}|${index}`);
      const handle = `@${competitor.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "")}`;
      const platform = ["instagram", "tiktok", "youtube"][seed % 3];
      const followerBase = 18 + (seed % 47);
      const topAngles = workspaceTopics.slice(index, index + 3);
      const style =
        competitor.toLowerCase().includes("in-house")
          ? "In-house operation"
          : competitor.toLowerCase().includes("freelance")
            ? "Creator collective"
            : competitor.toLowerCase().includes("ai")
              ? "AI-first content"
              : "Operator-led content";

      cards.push({
        id: `competitor::${workflow.workspaceId}::${index}`,
        handle,
        platform,
        followerValue: followerBase,
        followersLabel: `${followerBase}K`,
        frequency: ["Daily+", "5-6x / week", "2-3x / week"][seed % 3],
        style,
        workspaceName: workspace?.name ?? workflow.workspaceId,
        topAngles: topAngles.map((entry) => entry.title),
        signatureFormula:
          topAngles[0]?.hookAngle ??
          excerpt(workspace?.painPoints?.[0] ?? "No competitor formula recorded yet.", 116)
      });
    });
  });

  return cards.sort((left, right) => right.followerValue - left.followerValue).slice(0, 3);
}

function ideaBank(topics) {
  return topics.slice(0, 4).map((topic, index) => ({
    id: `idea-bank::${topic.id}`,
    title: topic.hookAngle,
    workspaceName: topic.workspaceName,
    platforms: topic.platforms,
    pipelineLabel: index === 0 ? "Priority" : "Pipeline",
    updatedAt: topic.updatedAt
  }));
}

export function contentResearchSnapshot() {
  const topics = derivedTopics(contentResearchRuns());
  const competitors = competitorCardsFromTopics(topics);
  const ideas = ideaBank(topics);

  return {
    topicCount: topics.length,
    competitorCount: competitors.length,
    ideaCount: ideas.length,
    topics,
    competitors,
    ideas
  };
}
