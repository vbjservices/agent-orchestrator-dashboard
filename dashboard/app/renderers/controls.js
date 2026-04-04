import { nodes, state, statusFilters, uiState } from "../context.js";
import { escapeHtml } from "../lib.js";
import {
  agentInstancesInScope,
  baseWorkflows,
  ensureSelectedRun,
  getWorkflowActivity,
  orchestratorsInScope
} from "../model.js";

function statusCounts() {
  const dashboardWorkflows = baseWorkflows().filter((workflow) => workflow.templateId === "content-pipeline");

  if (uiState.activeView === "dashboard") {
    return statusFilters.reduce((accumulator, status) => {
      accumulator[status] =
        status === "all"
          ? dashboardWorkflows.length
          : dashboardWorkflows.filter((workflow) => getWorkflowActivity(workflow).state === status).length;
      return accumulator;
    }, {});
  }

  if (uiState.activeView === "agents") {
    const instances = agentInstancesInScope();

    return statusFilters.reduce((accumulator, status) => {
      accumulator[status] =
        status === "all" ? instances.length : instances.filter((instance) => instance.state === status).length;
      return accumulator;
    }, {});
  }

  if (uiState.activeView === "orchestrators") {
    const orchestrators = orchestratorsInScope();

    return statusFilters.reduce((accumulator, status) => {
      accumulator[status] =
        status === "all"
          ? orchestrators.length
          : orchestrators.filter((orchestrator) => orchestrator.state === status).length;
      return accumulator;
    }, {});
  }

  return statusFilters.reduce((accumulator, status) => {
    accumulator[status] =
      status === "all"
        ? baseWorkflows().length
        : baseWorkflows().filter((workflow) => getWorkflowActivity(workflow).state === status).length;
    return accumulator;
  }, {});
}

export function renderWorkspaceSwitcher({ renderScopedSections }) {
  const buttons = [
    {
      id: "all",
      name: "All workspaces",
      vertical: `${state.workspaces.length} tenants loaded`
    },
    ...state.workspaces
  ]
    .map(
      (workspace) => `
        <button class="workspace-pill ${workspace.id === uiState.workspaceId ? "is-active" : ""}" data-workspace-id="${workspace.id}">
          <span>${workspace.name}</span>
          <small>${workspace.vertical}</small>
        </button>
      `
    )
    .join("");

  nodes.workspaceSwitcher.innerHTML = buttons || `<p class="empty">No workspaces configured.</p>`;

  nodes.workspaceSwitcher.querySelectorAll("[data-workspace-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.workspaceId = button.dataset.workspaceId;
      ensureSelectedRun();
      renderWorkspaceSwitcher({ renderScopedSections });
      await renderScopedSections();
    });
  });
}

export function renderControlBar({ renderScopedSections }) {
  const workflowCounts = statusCounts();

  nodes.controlBar.innerHTML = `
    <div class="operator-controls">
      <label class="search-field">
        <span class="search-field__label">Search platform surfaces</span>
        <input
          id="search-query"
          type="search"
          value="${escapeHtml(uiState.searchQuery)}"
          placeholder="Search by workflow, agent, workspace, trigger, or summary"
          autocomplete="off"
        />
      </label>
      <div class="filter-strip">
        ${statusFilters
          .map(
            (status) => `
              <button
                class="filter-pill ${uiState.statusFilter === status ? "is-active" : ""}"
                data-status-filter="${status}"
              >
                <span>${status}</span>
                <small>${workflowCounts[status] ?? 0}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  const searchInput = nodes.controlBar.querySelector("#search-query");
  searchInput.addEventListener("input", async (event) => {
    uiState.searchQuery = event.target.value;
    ensureSelectedRun();
    await renderScopedSections();
  });

  nodes.controlBar.querySelectorAll("[data-status-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.statusFilter = button.dataset.statusFilter;
      ensureSelectedRun();
      renderControlBar({ renderScopedSections });
      await renderScopedSections();
    });
  });
}
