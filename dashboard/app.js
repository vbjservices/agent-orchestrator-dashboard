import { state, nodes, sectionNodes } from "./app/context.js";
import { displayDate, nextPaint, wait } from "./app/lib.js";
import { showScopeLoaders, showSectionLoader } from "./app/loaders.js";
import { ensureSelectedAgent, ensureSelectedRun } from "./app/model.js";
import { renderControlBar, renderWorkspaceSwitcher } from "./app/renderers/controls.js";
import { renderCommandDeck, renderMetrics, renderWorkspaceSpotlight } from "./app/renderers/overview.js";
import { renderAgentFocus, renderWorkflows } from "./app/renderers/workflows.js";
import { renderRunDetail, renderRunList } from "./app/renderers/runs.js";

function renderRunListSection() {
  renderRunList({ renderRunDetail });
}

function renderWorkflowSection() {
  renderWorkflows({
    renderAgentFocus,
    renderRunDetail,
    renderRunList: renderRunListSection
  });
}

async function renderPrimarySections() {
  nodes.modeBadge.textContent = state.mode;
  nodes.generatedAt.textContent = displayDate(state.generatedAt);

  showSectionLoader("controlBar", "Priming operator controls");
  showSectionLoader("workspaceSpotlight", "Loading workspace context");
  showSectionLoader("commandDeck", "Preparing command deck");
  showSectionLoader("workspaceSwitcher", "Loading workspace scopes", true);
  showSectionLoader("metrics", "Summarizing telemetry");
  showSectionLoader("agentFocus", "Preparing agent focus");

  await nextPaint();
  renderWorkspaceSwitcher({ renderScopedSections });
  renderControlBar({ renderScopedSections });
  renderWorkspaceSpotlight();
  renderCommandDeck();
  renderMetrics();
}

async function renderScopedSections() {
  ensureSelectedRun();
  ensureSelectedAgent();
  showScopeLoaders();

  await nextPaint();
  renderWorkspaceSpotlight();
  renderCommandDeck();
  renderMetrics();

  await nextPaint();
  renderWorkflowSection();

  await nextPaint();
  renderAgentFocus();

  await nextPaint();
  renderRunListSection();

  await nextPaint();
  renderRunDetail();
}

async function bootstrap() {
  try {
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
