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
  activeView: "dashboard",
  isSidebarOpen: false,
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
  navMenu: document.querySelector("#nav-menu"),
  navToggle: document.querySelector("#nav-toggle"),
  sidebarClose: document.querySelector("#sidebar-close"),
  sidebar: document.querySelector("#sidebar"),
  sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
  workspaceSwitcher: document.querySelector("#workspace-switcher"),
  metrics: document.querySelector("#metrics"),
  workflowGrid: document.querySelector("#workflow-grid"),
  workflowTemplateGrid: document.querySelector("#workflow-template-grid"),
  workflowScope: document.querySelector("#workflow-scope"),
  agentTemplateGrid: document.querySelector("#agent-template-grid"),
  agentScope: document.querySelector("#agent-scope"),
  agentInstanceGrid: document.querySelector("#agent-instance-grid"),
  orchestratorGrid: document.querySelector("#orchestrator-grid"),
  orchestratorScope: document.querySelector("#orchestrator-scope"),
  orchestratorSetup: document.querySelector("#orchestrator-setup"),
  runList: document.querySelector("#run-list"),
  runDetail: document.querySelector("#run-detail"),
  dashboardView: document.querySelector("#view-dashboard"),
  workflowsView: document.querySelector("#view-workflows"),
  agentsView: document.querySelector("#view-agents"),
  orchestratorsView: document.querySelector("#view-orchestrators"),
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
  workflowTemplates: nodes.workflowTemplateGrid,
  workflows: nodes.workflowGrid,
  agentTemplates: nodes.agentTemplateGrid,
  agentInstances: nodes.agentInstanceGrid,
  orchestrators: nodes.orchestratorGrid,
  orchestratorSetup: nodes.orchestratorSetup,
  runList: nodes.runList,
  runDetail: nodes.runDetail
};
