import { nodes, uiState } from "../context.js";

let escapeHandlerBound = false;

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workflows", label: "Workflows" },
  { id: "agents", label: "Agents" },
  { id: "orchestrators", label: "Orchestrators" }
];

function syncViews() {
  const views = {
    dashboard: nodes.dashboardView,
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
        >
          <span>${item.label}</span>
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
