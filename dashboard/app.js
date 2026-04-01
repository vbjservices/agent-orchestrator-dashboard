import { state, nodes, sectionNodes, uiState } from "./app/context.js";
import { displayDate, nextPaint, wait } from "./app/lib.js";
import { showScopeLoaders, showSectionLoader } from "./app/loaders.js";
import { ensureSelectedRun, selectedAgentContext, selectedWorkflowContext } from "./app/model.js";
import { renderControlBar, renderWorkspaceSwitcher } from "./app/renderers/controls.js";
import { renderNavigation } from "./app/renderers/navigation.js";
import { renderMetrics, renderWorkspaceSpotlight } from "./app/renderers/overview.js";
import {
  renderAgentInstances,
  renderAgentTemplates,
  renderOrchestrators,
  renderWorkflowTemplates
} from "./app/renderers/platform.js";
import { renderViewScopes } from "./app/renderers/scopes.js";
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
  nodes.modeBadge.textContent = state.mode;
  nodes.generatedAt.textContent = displayDate(state.generatedAt);

  showSectionLoader("controlBar", "Priming operator controls");
  showSectionLoader("workspaceSpotlight", "Loading workspace context");
  showSectionLoader("workspaceSwitcher", "Loading workspace scopes", true);
  showSectionLoader("metrics", "Summarizing telemetry");
  showSectionLoader("workflowTemplates", "Loading workflow templates");
  showSectionLoader("workflows", "Loading workflow instances");
  showSectionLoader("agentTemplates", "Loading agent templates");
  showSectionLoader("agentInstances", "Loading agent instances");
  showSectionLoader("orchestrators", "Loading orchestrator surfaces");
  showSectionLoader("orchestratorSetup", "Loading setup model");
  showSectionLoader("runList", "Loading execution ledger");
  showSectionLoader("runDetail", "Loading run trace");

  await nextPaint();
  renderNavigation({
    onNavigate: async () => {
      closeModals();
      await renderScopedSections();
    }
  });
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderWorkspaceSpotlight();
  renderMetrics();
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
  renderNavigation({
    onNavigate: async () => {
      closeModals();
      await renderScopedSections();
    }
  });
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderWorkspaceSpotlight();
  renderMetrics();
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
