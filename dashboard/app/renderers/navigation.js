import { nodes, persistActiveView, uiState } from "../context.js";

let escapeHandlerBound = false;

const navItems = [
  { id: "dashboard", label: "Dashboard", topbarLabel: "Dashboard", icon: "dashboard" },
  { id: "search", label: "Search", topbarLabel: "Search", icon: "search" },
  { id: "research", label: "Research", topbarLabel: "Research", icon: "research" },
  { id: "pipeline", label: "Pipeline", topbarLabel: "Pipeline", icon: "pipeline" },
  { id: "performance", label: "Analytics", topbarLabel: "Analytics", icon: "analytics" },
  { id: "tasks", label: "Tasks", topbarLabel: "Tasks", icon: "tasks" },
  { id: "workflows", label: "Workflows", topbarLabel: "Workflows", icon: "workflows" },
  { id: "agents", label: "Agents", topbarLabel: "Agents", icon: "agents" },
  { id: "orchestrators", label: "Orchestrators", topbarLabel: "Orchestrators", icon: "orchestrators" }
];

export function labelForView(viewId) {
  return navItems.find((item) => item.id === viewId)?.topbarLabel ?? "Dashboard";
}

function navIcon(name) {
  const paths = {
    dashboard:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5v4.5H3.75zm0 9h7.5v4.5h-7.5zm10.5 0h6v4.5h-6z" />`,
    search:
      `<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6 6a7.5 7.5 0 0 0 10.65 10.65Z" />`,
    research:
      `<path stroke-linecap="round" stroke-linejoin="round" d="m20 20-3.6-3.6m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z M12 8.75v2.75m0 2.5h.01" />`,
    pipeline:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 5.25h15m-15 6.75h15m-15 6.75h15M8.25 3v18" />`,
    analytics:
      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5h15M6.75 15.75v-3m4.5 3V6.75m4.5 9V10.5M5.25 10.5 9 8.25l3 2.25 5.25-5.25" />`,
    tasks:
      `
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5h6a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 15 19.5H9a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 9 4.5Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 4.5V3.75A1.5 1.5 0 0 1 12 2.25h0a1.5 1.5 0 0 1 1.5 1.5v.75" />
        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 11.25 1.5 1.5 3-3" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 15.75h4.5" />
      `,
    workflows:
      `
        <circle cx="6.75" cy="6.75" r="2.25" />
        <circle cx="17.25" cy="6.75" r="2.25" />
        <circle cx="12" cy="17.25" r="2.25" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75h6M8.1 8.55l2.85 5.25m2.95-5.25-2.85 5.25" />
      `,
    agents:
      `
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5V3m6 1.5V3" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5h7.5A2.25 2.25 0 0 1 18 9.75v5.25a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 6 15V9.75A2.25 2.25 0 0 1 8.25 7.5Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 12h7.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 10.5h.008v.008H9.75zm4.492 0h.008v.008h-.008z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v2.25m6-2.25v2.25M6 12H4.5m15 0H18" />
      `,
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
    research: nodes.researchView,
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
      persistActiveView(uiState.activeView);
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
