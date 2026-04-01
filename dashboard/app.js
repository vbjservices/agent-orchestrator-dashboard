import { state, nodes, sectionNodes, uiState } from "./app/context.js";
import { displayDate, nextPaint, wait } from "./app/lib.js";
import { showScopeLoaders, showSectionLoader } from "./app/loaders.js";
import { ensureSelectedRun, selectedAgentContext, selectedWorkflowContext } from "./app/model.js";
import { renderControlBar, renderWorkspaceSwitcher } from "./app/renderers/controls.js";
import { renderMetrics, renderWorkspaceSpotlight } from "./app/renderers/overview.js";
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

async function renderPrimarySections() {
  nodes.modeBadge.textContent = state.mode;
  nodes.generatedAt.textContent = displayDate(state.generatedAt);

  showSectionLoader("controlBar", "Priming operator controls");
  showSectionLoader("workspaceSpotlight", "Loading workspace context");
  showSectionLoader("workspaceSwitcher", "Loading workspace scopes", true);
  showSectionLoader("metrics", "Summarizing telemetry");

  await nextPaint();
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderWorkspaceSpotlight();
  renderMetrics();
}

async function renderScopedSections() {
  ensureSelectedRun();
  showScopeLoaders();

  await nextPaint();
  renderWorkspaceSpotlight();
  renderMetrics();

  await nextPaint();
  renderWorkflowSection();

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
