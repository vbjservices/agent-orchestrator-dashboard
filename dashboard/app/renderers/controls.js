import { nodes, state, statusFilters, uiState } from "../context.js";
import { escapeHtml } from "../lib.js";
import { baseWorkflows, ensureSelectedRun, getWorkflowActivity } from "../model.js";

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
      uiState.copyFeedback = "";
      ensureSelectedRun();
      renderWorkspaceSwitcher({ renderScopedSections });
      await renderScopedSections();
    });
  });
}

export function renderControlBar({ renderScopedSections }) {
  const workflowCounts = statusFilters.reduce((accumulator, status) => {
    accumulator[status] =
      status === "all"
        ? baseWorkflows().length
        : baseWorkflows().filter((workflow) => getWorkflowActivity(workflow).state === status).length;
    return accumulator;
  }, {});

  nodes.controlBar.innerHTML = `
    <div class="operator-controls">
      <label class="search-field">
        <span class="search-field__label">Search workflows and runs</span>
        <input
          id="search-query"
          type="search"
          value="${escapeHtml(uiState.searchQuery)}"
          placeholder="Search by workflow, tenant, trigger, or summary"
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
