import { sectionNodes, uiState } from "./context.js";
import { escapeHtml } from "./lib.js";

export function loaderMarkup(message, inline = false) {
  return `
    <div class="panel-loader">
      <div class="pulse-bars-loader ${inline ? "pulse-bars-loader--inline" : ""}" role="status" aria-live="polite">
        <div class="pulse-bars-loader__bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p class="pulse-bars-loader__text">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

export function showSectionLoader(sectionName, message, inline = false) {
  sectionNodes[sectionName].innerHTML = loaderMarkup(message, inline);
}

export function showScopeLoaders() {
  showSectionLoader("workspaceSpotlight", "Refreshing workspace context");
  showSectionLoader("metrics", "Refreshing summary metrics");
  showSectionLoader("dashboardWorkflowBoard", "Refreshing workflow board");
  showSectionLoader("workflowTemplates", "Refreshing workflow templates");
  showSectionLoader("workflows", "Refreshing workflow surface");
  showSectionLoader("agentTemplates", "Refreshing agent templates");
  showSectionLoader("agentInstances", "Refreshing agent instances");
  showSectionLoader("orchestrators", "Refreshing orchestrator surfaces");
  showSectionLoader("orchestratorSetup", "Refreshing setup model");
  showSectionLoader("runList", "Refreshing execution ledger");
  showSectionLoader("runDetail", "Refreshing run trace");
}

export async function copyToClipboard(text, commandId, onComplete) {
  try {
    await navigator.clipboard.writeText(text);
    uiState.copyFeedback = commandId;
    onComplete?.();
    window.setTimeout(() => {
      if (uiState.copyFeedback === commandId) {
        uiState.copyFeedback = "";
        onComplete?.();
      }
    }, 1400);
  } catch (error) {
    console.error(error);
  }
}

export function attachCopyHandlers(rootNode, onComplete) {
  rootNode.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      await copyToClipboard(button.dataset.copyCommand, button.dataset.commandId, onComplete);
    });
  });
}
