export const fallbackState = {
  generatedAt: null,
  mode: "uninitialized",
  stats: {
    workspaceCount: 0,
    workflowCount: 0,
    runCount: 0,
    successRate: 0,
    totalCostEstimateUsd: 0
  },
  workspaces: [],
  workflows: [],
  runs: [],
  agents: []
};

export const state = window.__ORCHESTRATOR_STATE__ ?? fallbackState;
export const statusFilters = ["all", "running", "stopped", "error"];

export const uiState = {
  workspaceId: "all",
  runId: state.runs[0]?.id ?? null,
  searchQuery: "",
  statusFilter: "all",
  copyFeedback: "",
  selectedWorkflowId: "",
  isWorkflowModalOpen: false,
  selectedAgentKey: "",
  isAgentModalOpen: false
};

export const nodes = {
  workspaceSwitcher: document.querySelector("#workspace-switcher"),
  metrics: document.querySelector("#metrics"),
  workflowGrid: document.querySelector("#workflow-grid"),
  runList: document.querySelector("#run-list"),
  runDetail: document.querySelector("#run-detail"),
  workflowModal: document.querySelector("#workflow-modal"),
  workflowModalContent: document.querySelector("#workflow-modal-content"),
  agentModal: document.querySelector("#agent-modal"),
  agentModalContent: document.querySelector("#agent-modal-content"),
  modeBadge: document.querySelector("#mode-badge"),
  generatedAt: document.querySelector("#generated-at"),
  controlBar: document.querySelector("#control-bar"),
  workspaceSpotlight: document.querySelector("#workspace-spotlight")
};

export const sectionNodes = {
  controlBar: nodes.controlBar,
  workspaceSpotlight: nodes.workspaceSpotlight,
  workspaceSwitcher: nodes.workspaceSwitcher,
  metrics: nodes.metrics,
  workflows: nodes.workflowGrid,
  runList: nodes.runList,
  runDetail: nodes.runDetail
};
