import { nodes } from "../context.js";
import { agentAvatarMarkup, escapeHtml } from "../lib.js";
import { kpiSnapshot } from "../model.js";

function maxValue(values) {
  return Math.max(...values, 1);
}

function barChart(values, { width = 420, height = 176, tone = "cyan" } = {}) {
  if (!values.length) {
    return "";
  }

  const gap = 14;
  const innerWidth = width - gap * (values.length + 1);
  const barWidth = Math.max(innerWidth / values.length, 18);
  const max = maxValue(values);

  return values
    .map((value, index) => {
      const scaledHeight = Math.max((value / max) * (height - 24), 8);
      const x = gap + index * (barWidth + gap);
      const y = height - scaledHeight - 10;

      return `<rect class="kpi-chart__bar kpi-chart__bar--${tone}" x="${x}" y="${y}" width="${barWidth}" height="${scaledHeight}" rx="9" />`;
    })
    .join("");
}

function pointSeries(values, width, height, paddingX = 16, paddingY = 14) {
  if (!values.length) {
    return [];
  }

  const max = maxValue(values);
  const step = values.length === 1 ? 0 : (width - paddingX * 2) / (values.length - 1);

  return values.map((value, index) => {
    const x = paddingX + step * index;
    const y = height - paddingY - (value / max) * (height - paddingY * 2);
    return { x, y };
  });
}

function linePath(values, { width = 420, height = 176 } = {}) {
  const points = pointSeries(values, width, height);

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

function areaPath(values, { width = 420, height = 176 } = {}) {
  const points = pointSeries(values, width, height);

  if (!points.length) {
    return "";
  }

  const segments = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  const first = points[0];
  const last = points.at(-1);

  return `${segments} L${last.x.toFixed(1)},${(height - 10).toFixed(1)} L${first.x.toFixed(1)},${(height - 10).toFixed(1)} Z`;
}

function trendCard(execution) {
  const labels = execution.labels
    .map((label) => `<span>${escapeHtml(label)}</span>`)
    .join("");

  return `
    <article class="kpi-card kpi-card--trend">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Execution trend</p>
          <h2>Run volume, duration, and step density</h2>
        </div>
        <div class="kpi-card__meta-stack">
          <span>${escapeHtml(execution.averageDurationLabel)}</span>
          <span>${escapeHtml(execution.totalCostLabel)}</span>
          <span>${escapeHtml(execution.totalStepsLabel)}</span>
        </div>
      </div>
      <div class="kpi-chart kpi-chart--trend" aria-hidden="true">
        <svg viewBox="0 0 420 176" preserveAspectRatio="none">
          <defs>
            <linearGradient id="kpi-area-execution" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(95, 112, 255, 0.42)" />
              <stop offset="100%" stop-color="rgba(95, 112, 255, 0)" />
            </linearGradient>
          </defs>
          <path class="kpi-chart__grid" d="M12 32H408 M12 88H408 M12 144H408" />
          ${barChart(execution.steps, { width: 420, height: 176, tone: "violet" })}
          <path class="kpi-chart__area" d="${areaPath(execution.durations)}" fill="url(#kpi-area-execution)" />
          <path class="kpi-chart__line kpi-chart__line--cyan" d="${linePath(execution.durations)}" />
        </svg>
      </div>
      <div class="kpi-chart__labels">${labels}</div>
    </article>
  `;
}

function ringMeter(entry) {
  const safeTotal = Math.max(entry.total, 1);
  const ratio = Math.min(entry.value / safeTotal, 1);
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - ratio);

  return `
    <article class="kpi-ring kpi-ring--${entry.tone}">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle class="kpi-ring__track" cx="36" cy="36" r="28" />
        <circle
          class="kpi-ring__value"
          cx="36"
          cy="36"
          r="28"
          stroke-dasharray="${circumference.toFixed(2)}"
          stroke-dashoffset="${dashOffset.toFixed(2)}"
        />
      </svg>
      <div class="kpi-ring__copy">
        <strong>${entry.value}</strong>
        <span>${escapeHtml(entry.label)}</span>
      </div>
    </article>
  `;
}

function workflowStatusCard(workflowMix) {
  return `
    <article class="kpi-card kpi-card--status">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Control state</p>
          <h2>Workflow health and success mix</h2>
        </div>
      </div>
      <div class="kpi-ring-grid">
        ${workflowMix.map(ringMeter).join("")}
      </div>
    </article>
  `;
}

function platformLine(platform, index) {
  const path = linePath(platform.series, { width: 244, height: 82 });

  return `
    <div class="kpi-platform kpi-platform--${platform.tone}">
      <div class="kpi-platform__head">
        <strong>${escapeHtml(platform.label)}</strong>
        <span>${escapeHtml(platform.stat)}</span>
      </div>
      <small>${escapeHtml(platform.meta)}</small>
      <svg viewBox="0 0 244 82" preserveAspectRatio="none" aria-hidden="true">
        <path class="kpi-chart__grid" d="M10 22H234 M10 54H234" />
        <path class="kpi-chart__line kpi-chart__line--tone-${index + 1}" d="${path}" />
      </svg>
    </div>
  `;
}

function platformCard(platformSignals) {
  return `
    <article class="kpi-card kpi-card--platforms">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Platform signals</p>
          <h2>${escapeHtml(platformSignals.headline)}</h2>
          <p class="section-note">${escapeHtml(platformSignals.subline)}</p>
        </div>
      </div>
      <div class="kpi-platform-grid">
        ${platformSignals.platforms.map(platformLine).join("")}
      </div>
    </article>
  `;
}

function verticalBar(stage) {
  const safeHeight = Math.max(stage.value * 24, 14);

  return `
    <div class="kpi-stage kpi-stage--${stage.tone}">
      <div class="kpi-stage__bar" style="height:${safeHeight}px"></div>
      <strong>${stage.value}</strong>
      <span>${escapeHtml(stage.label)}</span>
    </div>
  `;
}

function pipelineCard(pipelineSignals) {
  return `
    <article class="kpi-card kpi-card--pipeline">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Pipeline mix</p>
          <h2>Content state distribution</h2>
        </div>
      </div>
      <div class="kpi-stage-grid">
        ${pipelineSignals.map(verticalBar).join("")}
      </div>
    </article>
  `;
}

function workspaceRow(workspace) {
  return `
    <div class="kpi-list-row">
      <div>
        <strong>${escapeHtml(workspace.name)}</strong>
        <small>${escapeHtml(workspace.description)}</small>
      </div>
      <div class="kpi-list-row__meta">
        <span>${workspace.runCount} runs</span>
        <span>${workspace.successRate}% success</span>
        <span>${escapeHtml(workspace.totalCostLabel)}</span>
      </div>
    </div>
  `;
}

function workspaceCard(workspaces) {
  return `
    <article class="kpi-card kpi-card--workspace">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Workspace pressure</p>
          <h2>Execution throughput by tenant</h2>
        </div>
      </div>
      <div class="kpi-list">
        ${workspaces.length ? workspaces.map(workspaceRow).join("") : `<p class="empty">No workspace activity is visible in scope.</p>`}
      </div>
    </article>
  `;
}

function agentRow(agent) {
  return `
    <div class="kpi-agent-row">
      <div class="kpi-agent-row__identity">
        ${agentAvatarMarkup("sm", { agentName: agent.name, category: agent.category })}
        <div>
          <strong>${escapeHtml(agent.name)}</strong>
          <small>${escapeHtml(agent.nextTaskTitle)}</small>
        </div>
      </div>
      <div class="kpi-agent-row__progress">
        <span class="kpi-agent-row__value">${agent.progress}%</span>
        <div class="kpi-agent-row__track"><span style="width:${agent.progress}%"></span></div>
      </div>
    </div>
  `;
}

function agentCard(agentLoad) {
  return `
    <article class="kpi-card kpi-card--agents">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Agent load</p>
          <h2>Current execution intensity by agent</h2>
        </div>
      </div>
      <div class="kpi-agent-list">
        ${agentLoad.length ? agentLoad.map(agentRow).join("") : `<p class="empty">No agent load is visible in scope.</p>`}
      </div>
    </article>
  `;
}

function spotlightCard(notes) {
  return `
    <article class="kpi-card kpi-card--spotlight">
      <div class="kpi-card__head">
        <div>
          <p class="eyebrow">Spotlight</p>
          <h2>Signals worth acting on</h2>
        </div>
      </div>
      <div class="kpi-note-list">
        ${notes
          .map(
            (note) => `
              <article class="kpi-note kpi-note--${note.tone}">
                <strong>${escapeHtml(note.label)}</strong>
                <p>${escapeHtml(note.text)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function metricCard(card) {
  return `
    <article class="kpi-card kpi-card--metric kpi-card--metric-${card.tone}">
      <p class="eyebrow">${escapeHtml(card.label)}</p>
      <strong class="kpi-card__value">${escapeHtml(card.value)}</strong>
      <span class="kpi-card__meta">${escapeHtml(card.meta)}</span>
    </article>
  `;
}

export function renderKpiDeck() {
  const snapshot = kpiSnapshot();

  nodes.kpiSurface.innerHTML = `
    <div class="kpi-grid">
      ${snapshot.cards.map(metricCard).join("")}
      ${trendCard(snapshot.execution)}
      ${workflowStatusCard(snapshot.workflowMix)}
      ${platformCard(snapshot.platformSignals)}
      ${pipelineCard(snapshot.pipelineSignals)}
      ${workspaceCard(snapshot.workspaceThroughput)}
      ${agentCard(snapshot.agentLoad)}
      ${spotlightCard(snapshot.spotlightNotes)}
    </div>
  `;
}
