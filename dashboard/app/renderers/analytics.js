import { nodes, persistActiveAnalyticsTab, uiState } from "../context.js";
import { renderKpiDeck } from "./kpi.js";
import { renderPerformanceDashboard } from "./performance.js";

function syncAnalyticsTabs() {
  const isPerformance = uiState.activeAnalyticsTab === "performance";

  nodes.analyticsTabs?.querySelectorAll("[data-analytics-tab]").forEach((button) => {
    const isActive = button.dataset.analyticsTab === uiState.activeAnalyticsTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  if (nodes.analyticsPerformancePanel) {
    nodes.analyticsPerformancePanel.hidden = !isPerformance;
  }

  if (nodes.analyticsKpiPanel) {
    nodes.analyticsKpiPanel.hidden = isPerformance;
  }
}

function bindAnalyticsTabs() {
  nodes.analyticsTabs?.querySelectorAll("[data-analytics-tab]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      if (uiState.activeAnalyticsTab === button.dataset.analyticsTab) {
        return;
      }

      uiState.activeAnalyticsTab = button.dataset.analyticsTab;
      persistActiveAnalyticsTab(uiState.activeAnalyticsTab);
      syncAnalyticsTabs();
    });
  });
}

export function renderAnalyticsView() {
  bindAnalyticsTabs();
  renderPerformanceDashboard();
  renderKpiDeck();
  syncAnalyticsTabs();
}
