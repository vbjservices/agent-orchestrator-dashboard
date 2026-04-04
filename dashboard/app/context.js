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
  workflowTemplates: [],
  runs: [],
  agents: []
};

export const state = window.__ORCHESTRATOR_STATE__ ?? fallbackState;
export const statusFilters = ["all", "running", "stopped", "error"];

export const uiState = {
  activeView: "dashboard",
  isSidebarOpen: false,
  feedRailWidth: 340,
  workspaceId: "all",
  runId: state.runs[0]?.id ?? null,
  searchQuery: "",
  statusFilter: "all",
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
  dashboardAiTeam: document.querySelector("#dashboard-ai-team"),
  dashboardAiTeamCount: document.querySelector("#dashboard-ai-team-count"),
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
  feedWidthRange: document.querySelector("#feed-width-range"),
  feedWidthValue: document.querySelector("#feed-width-value"),
  dashboardView: document.querySelector("#view-dashboard"),
  searchView: document.querySelector("#view-search"),
  workflowsView: document.querySelector("#view-workflows"),
  agentsView: document.querySelector("#view-agents"),
  orchestratorsView: document.querySelector("#view-orchestrators"),
  searchSummary: document.querySelector("#search-summary"),
  workflowModal: document.querySelector("#workflow-modal"),
  workflowModalContent: document.querySelector("#workflow-modal-content"),
  agentModal: document.querySelector("#agent-modal"),
  agentModalContent: document.querySelector("#agent-modal-content"),
  controlBar: document.querySelector("#control-bar")
};

export const sectionNodes = {
  controlBar: nodes.controlBar,
  workspaceSwitcher: nodes.workspaceSwitcher,
  searchSummary: nodes.searchSummary,
  metrics: nodes.metrics,
  dashboardAiTeam: nodes.dashboardAiTeam,
  workflowTemplates: nodes.workflowTemplateGrid,
  workflows: nodes.workflowGrid,
  agentTemplates: nodes.agentTemplateGrid,
  agentInstances: nodes.agentInstanceGrid,
  orchestrators: nodes.orchestratorGrid,
  orchestratorSetup: nodes.orchestratorSetup,
  runList: nodes.runList,
  runDetail: nodes.runDetail
};
