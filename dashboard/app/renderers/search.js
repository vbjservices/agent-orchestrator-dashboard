import { nodes } from "../context.js";
import {
  filteredAgentInstances,
  filteredOrchestrators,
  filteredRuns,
  filteredWorkflows
} from "../model.js";

export function renderSearchSummary() {
  const workflows = filteredWorkflows();
  const agents = filteredAgentInstances();
  const runs = filteredRuns();
  const orchestrators = filteredOrchestrators();

  nodes.searchSummary.innerHTML = `
    <div class="search-summary">
      <article class="search-summary__card">
        <p class="eyebrow">Workflows</p>
        <strong>${workflows.length}</strong>
        <span>Matching workflow instances under the current query and status scope.</span>
      </article>
      <article class="search-summary__card">
        <p class="eyebrow">Agents</p>
        <strong>${agents.length}</strong>
        <span>Matching agent instances and template-linked runtime contracts.</span>
      </article>
      <article class="search-summary__card">
        <p class="eyebrow">Runs</p>
        <strong>${runs.length}</strong>
        <span>Matching execution records across the visible tenant scope.</span>
      </article>
      <article class="search-summary__card">
        <p class="eyebrow">Orchestrators</p>
        <strong>${orchestrators.length}</strong>
        <span>Matching runtime routes and publishing surfaces in M1.</span>
      </article>
    </div>
  `;
}
