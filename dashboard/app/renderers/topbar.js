import { nodes, state, uiState } from "../context.js";
import { labelForView } from "./navigation.js";

function topbarTimestamp(value) {
  if (!value) {
    return "No refresh recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(new Date(value))
    .replace(",", " ·")
    .toUpperCase();
}

function topbarStatus() {
  if (!state.generatedAt) {
    return { label: "Pending", state: "pending" };
  }

  return { label: "Synced", state: "synced" };
}

function contextLabelForView(viewId) {
  const labels = {
    dashboard: "Activity Feed",
    search: "Search Scope",
    pipeline: "Roadmap",
    performance: "Insights",
    tasks: "Live Activity",
    workflows: "Workflow Surface",
    agents: "Agent Surface",
    orchestrators: "Runtime Surface"
  };

  return labels[viewId] ?? "Context";
}

export function renderTopbar() {
  const status = topbarStatus();

  if (nodes.topbarViewLabel) {
    nodes.topbarViewLabel.textContent = labelForView(uiState.activeView);
  }

  if (nodes.topbarStatusLabel) {
    nodes.topbarStatusLabel.textContent = status.label;
  }

  if (nodes.topbarStatusChip) {
    nodes.topbarStatusChip.dataset.state = status.state;
  }

  if (nodes.topbarMode) {
    nodes.topbarMode.textContent = state.mode ?? "uninitialized";
  }

  if (nodes.topbarRefresh) {
    nodes.topbarRefresh.textContent = topbarTimestamp(state.generatedAt);
  }

  if (nodes.topbarOperator) {
    nodes.topbarOperator.setAttribute("aria-label", "Current operator LK");
  }

  if (nodes.topbarContextLabel) {
    nodes.topbarContextLabel.textContent = contextLabelForView(uiState.activeView);
  }
}
