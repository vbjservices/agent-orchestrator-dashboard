const activeViewStorageKey = "dashboard.activeView";
const activeAnalyticsTabStorageKey = "dashboard.activeAnalyticsTab";

function restoreStoredValue(storageKey, fallbackValue, allowedValues) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return allowedValues.has(storedValue) ? storedValue : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

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
  activeView: restoreStoredValue(
    activeViewStorageKey,
    "dashboard",
    new Set([
      "dashboard",
      "search",
      "research",
      "pipeline",
      "performance",
      "tasks",
      "workflows",
      "agents",
      "orchestrators"
    ])
  ),
  activeAnalyticsTab: restoreStoredValue(
    activeAnalyticsTabStorageKey,
    "performance",
    new Set(["performance", "kpi"])
  ),
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

export function persistActiveView(viewId) {
  try {
    window.localStorage.setItem(activeViewStorageKey, viewId);
  } catch {}
}

export function persistActiveAnalyticsTab(tabId) {
  try {
    window.localStorage.setItem(activeAnalyticsTabStorageKey, tabId);
  } catch {}
}

export const nodes = {
  navMenu: document.querySelector("#nav-menu"),
  navToggle: document.querySelector("#nav-toggle"),
  sidebarClose: document.querySelector("#sidebar-close"),
  sidebar: document.querySelector("#sidebar"),
  sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
  topbarViewLabel: document.querySelector("#topbar-view-label"),
  topbarStatusChip: document.querySelector("#topbar-status-chip"),
  topbarStatusLabel: document.querySelector("#topbar-status-label"),
  topbarMode: document.querySelector("#topbar-mode"),
  topbarRefresh: document.querySelector("#topbar-refresh"),
  topbarOperator: document.querySelector("#topbar-operator"),
  dashboardRailResize: document.querySelector("#dashboard-rail-resize"),
  workspaceSwitcher: document.querySelector("#workspace-switcher"),
  metrics: document.querySelector("#metrics"),
  dashboardAiTeam: document.querySelector("#dashboard-ai-team"),
  dashboardAiTeamCount: document.querySelector("#dashboard-ai-team-count"),
  analyticsTabs: document.querySelector("#analytics-tabs"),
  analyticsPerformancePanel: document.querySelector("#analytics-panel-performance"),
  analyticsKpiPanel: document.querySelector("#analytics-panel-kpi"),
  researchTopics: document.querySelector("#research-topics"),
  researchCompetitors: document.querySelector("#research-competitors"),
  researchIdeaBank: document.querySelector("#research-idea-bank"),
  kpiSurface: document.querySelector("#kpi-surface"),
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
  searchView: document.querySelector("#view-search"),
  researchView: document.querySelector("#view-research"),
  pipelineView: document.querySelector("#view-pipeline"),
  performanceView: document.querySelector("#view-performance"),
  tasksView: document.querySelector("#view-tasks"),
  workflowsView: document.querySelector("#view-workflows"),
  agentsView: document.querySelector("#view-agents"),
  orchestratorsView: document.querySelector("#view-orchestrators"),
  searchSummary: document.querySelector("#search-summary"),
  pipelineBoard: document.querySelector("#pipeline-board"),
  performanceSummary: document.querySelector("#performance-summary"),
  performanceTable: document.querySelector("#performance-table"),
  performanceInsights: document.querySelector("#performance-insights"),
  taskAgentGrid: document.querySelector("#task-agent-grid"),
  taskQueue: document.querySelector("#task-queue"),
  taskActivity: document.querySelector("#task-activity"),
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
  kpiSurface: nodes.kpiSurface,
  researchTopics: nodes.researchTopics,
  researchCompetitors: nodes.researchCompetitors,
  researchIdeaBank: nodes.researchIdeaBank,
  pipelineBoard: nodes.pipelineBoard,
  performanceSummary: nodes.performanceSummary,
  performanceTable: nodes.performanceTable,
  performanceInsights: nodes.performanceInsights,
  taskAgentGrid: nodes.taskAgentGrid,
  taskQueue: nodes.taskQueue,
  taskActivity: nodes.taskActivity,
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
