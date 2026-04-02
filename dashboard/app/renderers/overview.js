import { nodes, state, uiState } from "../context.js";
import { currency, displayDate } from "../lib.js";
import { currentWorkspace, filteredRuns, filteredWorkflows } from "../model.js";

export function renderMetrics() {
  const runs = filteredRuns();
  const workflows = filteredWorkflows();
  const successfulRuns = runs.filter((run) => run.status === "succeeded").length;
  const successRate = runs.length === 0 ? 0 : Math.round((successfulRuns / runs.length) * 100);
  const totalCost = runs.reduce((sum, run) => sum + run.costEstimateUsd, 0);
  const activeWorkspaces =
    uiState.workspaceId === "all"
      ? state.workspaces.length
      : state.workspaces.filter((workspace) => workspace.id === uiState.workspaceId).length;

  const cards = [
    ["workspaces", "Workspaces", String(activeWorkspaces), "Tenants currently in scope"],
    ["workflows", "Workflow instances", String(workflows.length), "Filtered operator-ready workflows"],
    ["success", "Success rate", `${successRate}%`, "Run health inside the active scope"],
    ["cost", "Estimated cost", currency(totalCost), "Visible run cost estimate"]
  ];

  nodes.metrics.innerHTML = cards
    .map(
      ([tone, label, value, meta]) => `
        <article class="metric-card metric-card--${tone}">
          <p class="metric-card__label">${label}</p>
          <strong class="metric-card__value">${value}</strong>
          <span class="metric-card__meta">${meta}</span>
        </article>
      `
    )
    .join("");
}

export function renderWorkspaceSpotlight() {
  const workspace = currentWorkspace();

  if (!workspace) {
    const totalGoals = state.workspaces.flatMap((entry) => entry.goals ?? []).slice(0, 3);

    nodes.workspaceSpotlight.innerHTML = `
      <div class="spotlight-card">
        <div class="spotlight-card__head">
          <div>
            <p class="eyebrow">All tenants</p>
            <h3>Cross-workspace operator view</h3>
          </div>
          <span class="status-chip status-chip--${uiState.statusFilter}">${uiState.statusFilter}</span>
        </div>
        <p class="spotlight-card__body">
          Use this scope to compare tenant health, find noisy launch surfaces fast, and spot where execution pressure is drifting.
        </p>
        <dl class="spotlight-card__meta">
          <div>
            <dt>Tenants</dt>
            <dd>${state.workspaces.length}</dd>
          </div>
          <div>
            <dt>Runs in scope</dt>
            <dd>${filteredRuns().length}</dd>
          </div>
          <div>
            <dt>Last refresh</dt>
            <dd>${displayDate(state.generatedAt)}</dd>
          </div>
          <div>
            <dt>Platform mode</dt>
            <dd>${state.mode}</dd>
          </div>
        </dl>
        <ul class="spotlight-list">
          ${totalGoals.map((goal) => `<li>${goal}</li>`).join("")}
        </ul>
      </div>
    `;
    return;
  }

  nodes.workspaceSpotlight.innerHTML = `
    <div class="spotlight-card">
      <div class="spotlight-card__head">
        <div>
          <p class="eyebrow">${workspace.vertical}</p>
          <h3>${workspace.name}</h3>
        </div>
        <span class="status-chip status-chip--succeeded">${workspace.plan}</span>
      </div>
      <p class="spotlight-card__body">
        ${workspace.idealCustomerProfile}
      </p>
      <dl class="spotlight-card__meta">
        <div>
          <dt>Timezone</dt>
          <dd>${workspace.timezone}</dd>
        </div>
        <div>
          <dt>Active workflows</dt>
          <dd>${workspace.activeWorkflowCount}</dd>
        </div>
        <div>
          <dt>Total runs</dt>
          <dd>${workspace.totalRuns}</dd>
        </div>
        <div>
          <dt>Success rate</dt>
          <dd>${workspace.successRate}%</dd>
        </div>
      </dl>
      <ul class="spotlight-list">
        ${(workspace.goals ?? []).map((goal) => `<li>${goal}</li>`).join("")}
      </ul>
    </div>
  `;
}
