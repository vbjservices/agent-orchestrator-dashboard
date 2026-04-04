import { sectionNodes } from "./context.js";
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
  showSectionLoader("searchSummary", "Refreshing search summary");
  showSectionLoader("metrics", "Refreshing summary metrics");
  showSectionLoader("dashboardAiTeam", "Refreshing AI team");
  showSectionLoader("workflowTemplates", "Refreshing workflow templates");
  showSectionLoader("workflows", "Refreshing workflow surface");
  showSectionLoader("agentTemplates", "Refreshing agent templates");
  showSectionLoader("agentInstances", "Refreshing agent instances");
  showSectionLoader("orchestrators", "Refreshing orchestrator surfaces");
  showSectionLoader("orchestratorSetup", "Refreshing setup model");
  showSectionLoader("runList", "Refreshing execution ledger");
  showSectionLoader("runDetail", "Refreshing run trace");
}
