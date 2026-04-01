import { nodes, state, uiState } from "../context.js";
import { escapeHtml } from "../lib.js";
import {
  agentTemplatesInScope,
  currentWorkspace,
  filteredAgentInstances,
  filteredOrchestrators,
  filteredWorkflows,
  workflowTemplatesInScope
} from "../model.js";

function scopeValue() {
  return currentWorkspace()?.name ?? "All workspaces";
}

function statusValue() {
  return uiState.statusFilter === "all" ? "All states" : uiState.statusFilter;
}

function queryValue() {
  return uiState.searchQuery.trim() || "No query";
}

function chipsMarkup(entries) {
  return entries
    .map(
      ([label, value]) => `
        <span class="scope-chip">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </span>
      `
    )
    .join("");
}

export function renderViewScopes() {
  nodes.workflowScope.innerHTML = `
    <div class="scope-banner">
      <div class="scope-banner__head">
        <div>
          <p class="eyebrow">Workflow Scope</p>
          <h2>Template definitions and tenant instances</h2>
        </div>
        <p class="scope-note">
          This view stays on workflow structure and launchability instead of repeating run telemetry.
        </p>
      </div>
      <div class="scope-strip">
        ${chipsMarkup([
          ["Workspace", scopeValue()],
          ["Status", statusValue()],
          ["Query", queryValue()],
          ["Templates", String(workflowTemplatesInScope().length)],
          ["Instances", String(filteredWorkflows().length)]
        ])}
      </div>
    </div>
  `;

  nodes.agentScope.innerHTML = `
    <div class="scope-banner">
      <div class="scope-banner__head">
        <div>
          <p class="eyebrow">Agent Scope</p>
          <h2>Platform templates and attached tenant agents</h2>
        </div>
        <p class="scope-note">
          This view stays on agent coverage and attachment state instead of replaying dashboard-wide context.
        </p>
      </div>
      <div class="scope-strip">
        ${chipsMarkup([
          ["Workspace", scopeValue()],
          ["Status", statusValue()],
          ["Query", queryValue()],
          ["Templates", String(agentTemplatesInScope().length)],
          ["Instances", String(filteredAgentInstances().length)]
        ])}
      </div>
    </div>
  `;

  nodes.orchestratorScope.innerHTML = `
    <div class="scope-banner">
      <div class="scope-banner__head">
        <div>
          <p class="eyebrow">Orchestrator Scope</p>
          <h2>Trigger routes and runtime boundaries</h2>
        </div>
        <p class="scope-note">
          This view stays on how workflows get activated and published instead of mirroring dashboard KPIs.
        </p>
      </div>
      <div class="scope-strip">
        ${chipsMarkup([
          ["Workspace", scopeValue()],
          ["Status", statusValue()],
          ["Query", queryValue()],
          ["Surfaces", String(filteredOrchestrators().length)],
          ["Runtime", state.mode]
        ])}
      </div>
    </div>
  `;
}
