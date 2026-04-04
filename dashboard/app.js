import { nodes, sectionNodes, uiState } from "./app/context.js";
import { initializeFeedRailResize, nextPaint, wait } from "./app/lib.js";
import { showScopeLoaders, showSectionLoader } from "./app/loaders.js";
import { ensureSelectedRun, selectedAgentContext, selectedWorkflowContext } from "./app/model.js";
import { renderControlBar, renderWorkspaceSwitcher } from "./app/renderers/controls.js";
import { renderAnalyticsView } from "./app/renderers/analytics.js";
import { renderAiTeam } from "./app/renderers/dashboard.js";
import { renderNavigation } from "./app/renderers/navigation.js";
import { renderMetrics } from "./app/renderers/overview.js";
import { renderContentPipeline } from "./app/renderers/pipeline.js";
import { renderContentResearch } from "./app/renderers/research.js";
import { renderAgentTasks } from "./app/renderers/tasks.js";
import {
  renderAgentInstances,
  renderAgentTemplates,
  renderOrchestrators,
  renderWorkflowTemplates
} from "./app/renderers/platform.js";
import { renderSearchSummary } from "./app/renderers/search.js";
import { renderViewScopes } from "./app/renderers/scopes.js";
import { renderTopbar } from "./app/renderers/topbar.js";
import {
  initializeAgentModal,
  initializeWorkflowModal,
  renderAgentModal,
  renderWorkflowModal,
  renderWorkflows
} from "./app/renderers/workflows.js";
import { renderRunDetail, renderRunList } from "./app/renderers/runs.js";

function renderRunListSection() {
  renderRunList({ renderRunDetail });
}

function renderWorkflowSection() {
  renderWorkflows({
    renderAgentModal,
    renderWorkflowModal,
    renderRunDetail,
    renderRunList: renderRunListSection
  });
}

function closeModals() {
  uiState.isAgentModalOpen = false;
  uiState.isWorkflowModalOpen = false;
  nodes.agentModal.hidden = true;
  nodes.workflowModal.hidden = true;
}

async function renderPrimarySections() {
  showSectionLoader("controlBar", "Priming operator controls");
  showSectionLoader("workspaceSwitcher", "Loading workspace scopes", true);
  showSectionLoader("searchSummary", "Loading search summary");
  showSectionLoader("researchTopics", "Loading research topics");
  showSectionLoader("researchCompetitors", "Loading competitor pulse");
  showSectionLoader("researchIdeaBank", "Loading idea bank");
  showSectionLoader("pipelineBoard", "Loading content roadmap");
  showSectionLoader("performanceSummary", "Loading performance summary");
  showSectionLoader("performanceTable", "Loading content performance");
  showSectionLoader("performanceInsights", "Loading performance insights");
  showSectionLoader("kpiSurface", "Loading KPI board");
  showSectionLoader("taskAgentGrid", "Loading agent workload");
  showSectionLoader("taskQueue", "Loading task queue");
  showSectionLoader("taskActivity", "Loading task activity");
  showSectionLoader("metrics", "Summarizing telemetry");
  showSectionLoader("dashboardAiTeam", "Mapping AI team");
  showSectionLoader("workflowTemplates", "Loading workflow templates");
  showSectionLoader("workflows", "Loading workflow instances");
  showSectionLoader("agentTemplates", "Loading agent templates");
  showSectionLoader("agentInstances", "Loading agent instances");
  showSectionLoader("orchestrators", "Loading orchestrator surfaces");
  showSectionLoader("orchestratorSetup", "Loading setup model");
  showSectionLoader("runList", "Loading execution ledger");
  showSectionLoader("runDetail", "Loading run trace");

  await nextPaint();
  renderTopbar();
  renderNavigation({
    onNavigate: async () => {
      closeModals();
      await renderScopedSections();
    }
  });
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderSearchSummary();
  renderContentResearch({ renderWorkflowModal, renderRunList: renderRunListSection, renderRunDetail });
  renderContentPipeline({ renderWorkflowModal, renderRunList: renderRunListSection, renderRunDetail });
  renderAnalyticsView();
  renderAgentTasks({ renderAgentModal });
  renderMetrics();
  renderAiTeam({ renderAgentModal });
  renderViewScopes();
  renderWorkflowTemplates();
  renderWorkflowSection();
  renderAgentTemplates();
  renderAgentInstances({ renderAgentModal });
  renderOrchestrators();
}

async function renderScopedSections() {
  ensureSelectedRun();
  showScopeLoaders();

  await nextPaint();
  renderTopbar();
  renderNavigation({
    onNavigate: async () => {
      closeModals();
      await renderScopedSections();
    }
  });
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderSearchSummary();
  renderContentResearch({ renderWorkflowModal, renderRunList: renderRunListSection, renderRunDetail });
  renderContentPipeline({ renderWorkflowModal, renderRunList: renderRunListSection, renderRunDetail });
  renderAnalyticsView();
  renderAgentTasks({ renderAgentModal });
  renderMetrics();
  renderAiTeam({ renderAgentModal });
  renderViewScopes();

  await nextPaint();
  renderWorkflowTemplates();
  renderWorkflowSection();
  renderAgentTemplates();
  renderAgentInstances({ renderAgentModal });
  renderOrchestrators();

  if (nodes.agentModal && !selectedAgentContext()) {
    uiState.isAgentModalOpen = false;
    nodes.agentModal.hidden = true;
  }

  await nextPaint();
  renderAgentModal();

  if (nodes.workflowModal && !selectedWorkflowContext()) {
    uiState.isWorkflowModalOpen = false;
    nodes.workflowModal.hidden = true;
  }

  await nextPaint();
  renderWorkflowModal({ renderRunList: renderRunListSection, renderRunDetail });

  await nextPaint();
  renderRunListSection();

  await nextPaint();
  renderRunDetail();
}

async function bootstrap() {
  try {
    initializeAgentModal({ renderAgentModal });
    initializeWorkflowModal({ renderWorkflowModal, renderRunList: renderRunListSection, renderRunDetail });
    uiState.feedRailWidth = initializeFeedRailResize({
      handle: nodes.dashboardRailResize,
      onWidthChange: (width) => {
        uiState.feedRailWidth = width;
      }
    });
    await wait(80);
    await renderPrimarySections();
    await renderScopedSections();
  } catch (error) {
    console.error(error);
    Object.values(sectionNodes).forEach((node) => {
      node.innerHTML = `<p class="empty">Dashboard section failed to load.</p>`;
    });
  }
}

bootstrap();
