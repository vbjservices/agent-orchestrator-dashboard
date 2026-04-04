import { nodes, uiState } from "../context.js";

let escapeHandlerBound = false;

const navItems = [
  { id: "dashboard", label: "Dashboard", topbarLabel: "Overview", icon: "dashboard" },
  { id: "search", label: "Search", topbarLabel: "Search", icon: "search" },
  { id: "pipeline", label: "Pipeline", topbarLabel: "Pipeline", icon: "pipeline" },
  { id: "performance", label: "Performance", topbarLabel: "Performance", icon: "performance" },
  { id: "tasks", label: "Tasks", topbarLabel: "Agent Tasks", icon: "tasks" },
  { id: "workflows", label: "Workflows", topbarLabel: "Workflows", icon: "workflows" },
  { id: "agents", label: "Agents", topbarLabel: "Agents", icon: "agents" },
  { id: "orchestrators", label: "Orchestrators", topbarLabel: "Orchestrators", icon: "orchestrators" }
];

export function labelForView(viewId) {
  return navItems.find((item) => item.id === viewId)?.topbarLabel ?? "Overview";
}

function navIcon(name) {
  const paths = {
    dashboard:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5v4.5H3.75zm0 9h7.5v4.5h-7.5zm10.5 0h6v4.5h-6z" />`,
    search:
      `<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6 6a7.5 7.5 0 0 0 10.65 10.65Z" />`,
    pipeline:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 5.25h15m-15 6.75h15m-15 6.75h15M8.25 3v18" />`,
    performance:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5h15M6.75 16.5V9m5.25 7.5V4.5m5.25 12V12" />`,
    tasks:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75h11.25M9 12h11.25M9 17.25h11.25M4.5 6.75h.008v.008H4.5zm0 5.25h.008v.008H4.5zm0 5.25h.008v.008H4.5z" />`,
    workflows:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 6.75h9m-9 5.25h6m-6 5.25h9M4.5 6.75h.008v.008H4.5zm0 5.25h.008v.008H4.5zm0 5.25h.008v.008H4.5z" />`,
    agents:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.125a7.5 7.5 0 0 1 15 0" />`,
    orchestrators:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 7.5h15m-12 4.5h9m-6 4.5h3m-8.25-9.75v9.75m8.25-9.75v9.75" />`
  };

  return `
    <span class="nav-link__icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        ${paths[name]}
      </svg>
    </span>
  `;
}

function syncViews() {
  const views = {
    dashboard: nodes.dashboardView,
    search: nodes.searchView,
    pipeline: nodes.pipelineView,
    performance: nodes.performanceView,
    tasks: nodes.tasksView,
    workflows: nodes.workflowsView,
    agents: nodes.agentsView,
    orchestrators: nodes.orchestratorsView
  };

  Object.entries(views).forEach(([viewId, node]) => {
    if (!node) {
      return;
    }

    const isActive = uiState.activeView === viewId;
    node.hidden = !isActive;
    node.classList.toggle("is-active", isActive);
  });
}

function syncSidebar() {
  const isOpen = uiState.isSidebarOpen;

  nodes.sidebar?.classList.toggle("is-open", isOpen);
  nodes.sidebarBackdrop.hidden = !isOpen;
  nodes.navToggle?.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("has-sidebar-open", isOpen);
}

export function renderNavigation({ onNavigate }) {
  nodes.navMenu.innerHTML = navItems
    .map(
      (item) => `
        <button
          class="nav-link ${uiState.activeView === item.id ? "is-active" : ""}"
          data-view-id="${item.id}"
          type="button"
          title="${item.label}"
          aria-label="${item.label}"
        >
          ${navIcon(item.icon)}
          <span class="nav-link__label">${item.label}</span>
        </button>
      `
    )
    .join("");

  nodes.navMenu.querySelectorAll("[data-view-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (uiState.activeView === button.dataset.viewId) {
        uiState.isSidebarOpen = false;
        syncSidebar();
        return;
      }

      uiState.activeView = button.dataset.viewId;
      uiState.isSidebarOpen = false;
      syncViews();
      syncSidebar();
      await onNavigate();
    });
  });

  nodes.navToggle.onclick = () => {
    uiState.isSidebarOpen = !uiState.isSidebarOpen;
    syncSidebar();
  };

  if (nodes.sidebarClose) {
    nodes.sidebarClose.onclick = () => {
      uiState.isSidebarOpen = false;
      syncSidebar();
    };
  }

  nodes.sidebarBackdrop.onclick = () => {
    uiState.isSidebarOpen = false;
    syncSidebar();
  };

  if (!escapeHandlerBound) {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !uiState.isSidebarOpen) {
        return;
      }

      uiState.isSidebarOpen = false;
      syncSidebar();
    });
    escapeHandlerBound = true;
  }

  syncViews();
  syncSidebar();
}
