import { state } from "../context.js";
import { matchesSearch } from "./core.js";
import { filteredWorkflows } from "./workflows.js";

const platformConfig = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    handle: "@agentos_tt",
    audienceLabel: "Followers",
    volumeLabel: "Videos",
    audienceBase: 77,
    viewsBase: 4200,
    tone: "tiktok"
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    handle: "@agentos_ig",
    audienceLabel: "Followers",
    volumeLabel: "Posts",
    audienceBase: 26,
    viewsBase: 1900,
    tone: "instagram"
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    handle: "@agentos_yt",
    audienceLabel: "Subscribers",
    volumeLabel: "Videos",
    audienceBase: 16,
    viewsBase: 8800,
    tone: "youtube"
  }
};

function hash(value) {
  return Array.from(String(value ?? "")).reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 17), 0);
}

function compactNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return String(value);
}

function percent(value) {
  return `${value.toFixed(1)}%`;
}

function excerpt(value, length = 118) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length - 3).trimEnd()}...`;
}

function contentScriptRuns() {
  const workflowIds = new Set(
    filteredWorkflows()
      .filter((workflow) => workflow.templateId === "content-pipeline")
      .map((workflow) => workflow.id)
  );

  return (state.runs ?? []).filter(
    (run) =>
      run.workflowTemplateId === "content-pipeline" &&
      workflowIds.has(run.workflowInstanceId) &&
      run.primaryArtifact?.kind === "script"
  );
}

function postVariants(run, index) {
  const platformIds = ["tiktok", "instagram", "youtube"];
  const script = run.primaryArtifact?.script ?? "";
  const angle = run.primaryArtifact?.selectedAngle ?? {};

  return platformIds.map((platformId, offset) => {
    const platform = platformConfig[platformId];
    const seed = hash(`${platformId}|${run.id}|${angle.title}|${run.workspaceName}|${offset}`);
    const views = platform.viewsBase + (seed % 1400);
    const likes = Math.max(Math.round(views * (0.026 + (seed % 11) / 1000)), 4);
    const comments = Math.max(Math.round(views * (0.006 + (seed % 7) / 2000)), 1);
    const engagementRate = Number((((likes + comments * 2) / views) * 100).toFixed(1));
    const titleByPlatform = {
      tiktok: angle.title ?? run.summary,
      instagram: angle.hook ?? angle.title ?? run.summary,
      youtube: angle.angle ?? angle.title ?? excerpt(script, 92)
    };

    const summaryByPlatform = {
      tiktok: angle.hook ?? excerpt(script, 110),
      instagram: angle.angle ?? excerpt(script, 110),
      youtube: excerpt(script, 150)
    };

    return {
      id: `${run.id}::${platformId}`,
      platformId,
      platformLabel: platform.label,
      platformTone: platform.tone,
      workflowName: run.workflowName,
      workspaceName: run.workspaceName,
      postedAt: run.finishedAt,
      title: titleByPlatform[platformId],
      summary: summaryByPlatform[platformId],
      views,
      likes,
      comments,
      engagementRate,
      viewsLabel: compactNumber(views),
      engagementRateLabel: percent(engagementRate)
    };
  });
}

function postsInScope() {
  return contentScriptRuns()
    .flatMap(postVariants)
    .filter((post) =>
      matchesSearch([post.platformLabel, post.title, post.summary, post.workflowName, post.workspaceName])
    )
    .sort((left, right) => new Date(right.postedAt) - new Date(left.postedAt))
    .slice(0, 18);
}

function platformSnapshots(posts) {
  return Object.values(platformConfig).map((platform) => {
    const platformPosts = posts.filter((post) => post.platformId === platform.id);
    const totalViews = platformPosts.reduce((sum, post) => sum + post.views, 0);
    const averageEngagement =
      platformPosts.length === 0
        ? 0
        : platformPosts.reduce((sum, post) => sum + post.engagementRate, 0) / platformPosts.length;
    const sparkline = platformPosts.slice(0, 6).reverse().map((post) => post.views);

    return {
      ...platform,
      audience: platform.audienceBase + platformPosts.length * 4,
      contentVolume: platformPosts.length,
      totalViews,
      totalViewsLabel: compactNumber(totalViews),
      averageEngagement,
      averageEngagementLabel: percent(averageEngagement),
      sparkline
    };
  });
}

function insightCards(posts, platforms) {
  const topPlatform = [...platforms].sort((left, right) => right.totalViews - left.totalViews)[0] ?? null;
  const bestPost = [...posts].sort((left, right) => right.views - left.views)[0] ?? null;
  const watchPost = [...posts].sort((left, right) => left.views - right.views)[0] ?? null;

  return [
    {
      label: "Trending",
      tone: "trending",
      text: topPlatform
        ? `${topPlatform.label} is leading the current simulated performance view with ${topPlatform.totalViewsLabel} total views.`
        : "No platform signals yet."
    },
    {
      label: "Best Performer",
      tone: "best",
      text: bestPost
        ? `"${bestPost.title}" is the top current content item at ${bestPost.viewsLabel} views and ${bestPost.engagementRateLabel} engagement.`
        : "No standout performer yet."
    },
    {
      label: "Watch Closely",
      tone: "watch",
      text: watchPost
        ? `"${watchPost.title}" is currently lagging on ${watchPost.platformLabel}; it needs a stronger hook or repackaging.`
        : "No low performer identified yet."
    },
    {
      label: "Benchmark",
      tone: "benchmark",
      text: platforms.length
        ? platforms.map((platform) => `${platform.label} avg ${platform.averageEngagementLabel}`).join(" / ")
        : "No benchmark data yet."
    }
  ];
}

export function contentPerformanceSnapshot() {
  const posts = postsInScope();
  const platforms = platformSnapshots(posts);

  return {
    platforms,
    posts,
    insights: insightCards(posts, platforms)
  };
}
