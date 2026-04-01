import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import {
  agentTemplatesInScope,
  filteredAgentInstances,
  filteredOrchestrators,
  workflowTemplatesInScope
} from "../model.js";

export function renderWorkflowTemplates() {
  const templates = workflowTemplatesInScope();

  nodes.workflowTemplateGrid.innerHTML =
    templates
      .map(
        (template) => `
          <article class="template-card">
            <p class="eyebrow">Workflow Template</p>
            <h3>${template.name}</h3>
            <p class="template-card__body">${template.description}</p>
            <dl class="template-card__meta">
              <div>
                <dt>Instances</dt>
                <dd>${template.instanceCount}</dd>
              </div>
              <div>
                <dt>Steps</dt>
                <dd>${template.stepCount}</dd>
              </div>
              <div>
                <dt>Triggers</dt>
                <dd>${template.triggerModes.join(", ")}</dd>
              </div>
              <div>
                <dt>Workspaces</dt>
                <dd>${template.workspaces.length}</dd>
              </div>
            </dl>
          </article>
        `
      )
      .join("") || `<p class="empty">No workflow templates are visible in this scope.</p>`;
}

export function renderAgentTemplates() {
  const templates = agentTemplatesInScope();

  nodes.agentTemplateGrid.innerHTML =
    templates
      .map(
        (template) => `
          <article class="template-card">
            <p class="eyebrow">${template.category}</p>
            <h3>${template.name}</h3>
            <p class="template-card__body">${template.responsibility}</p>
            <dl class="template-card__meta">
              <div>
                <dt>Instances</dt>
                <dd>${template.instanceCount}</dd>
              </div>
              <div>
                <dt>Workspaces</dt>
                <dd>${template.workspaceCount}</dd>
              </div>
            </dl>
          </article>
        `
      )
      .join("") || `<p class="empty">No agent templates are visible in this scope.</p>`;
}

export function renderAgentInstances({ renderAgentModal }) {
  const instances = filteredAgentInstances();

  nodes.agentInstanceGrid.innerHTML =
    instances
      .map(
        (instance) => `
          <button
            class="instance-card instance-card--${instance.state}"
            data-agent-instance="${instance.primarySelectionKey}"
            type="button"
          >
            <div class="instance-card__head">
              <span class="instance-card__identity">
                ${agentAvatarMarkup("sm")}
                <span>${instance.agentName}</span>
              </span>
              <span class="live-state live-state--${instance.state}">
                <span class="live-state__orb"></span>
                <span>${instance.state}</span>
              </span>
            </div>
            <p class="instance-card__body">${instance.detail}</p>
            <dl class="instance-card__meta">
              <div>
                <dt>Workspace</dt>
                <dd>${instance.workspaceName}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>${instance.category}</dd>
              </div>
              <div>
                <dt>Workflows</dt>
                <dd>${instance.workflowCount}</dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>${instance.activeWorkflowCount}</dd>
              </div>
            </dl>
          </button>
        `
      )
      .join("") || `<p class="empty">No agent instances match the current scope.</p>`;

  nodes.agentInstanceGrid.querySelectorAll("[data-agent-instance]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedAgentKey = button.dataset.agentInstance;
      uiState.isWorkflowModalOpen = false;
      uiState.isAgentModalOpen = true;
      nodes.workflowModal.hidden = true;
      nodes.agentModal.hidden = false;
      nodes.agentModalContent.innerHTML = loaderMarkup("Loading agent popup");
      await nextPaint();
      renderAgentModal();
    });
  });
}

export function renderOrchestrators() {
  const orchestrators = filteredOrchestrators();

  nodes.orchestratorGrid.innerHTML =
    orchestrators
      .map(
        (entry) => `
          <article class="orchestrator-card orchestrator-card--${entry.state}">
            <div class="orchestrator-card__head">
              <div>
                <p class="eyebrow">Orchestrator</p>
                <h3>${entry.name}</h3>
              </div>
              <span class="live-state live-state--${entry.state}">
                <span class="live-state__orb"></span>
                <span>${entry.state}</span>
              </span>
            </div>
            <p class="orchestrator-card__body">${entry.detail}</p>
            <dl class="orchestrator-card__meta">
              <div>
                <dt>Attached surfaces</dt>
                <dd>${entry.attachmentCount}</dd>
              </div>
              <div>
                <dt>Setup boundary</dt>
                <dd>${entry.setup}</dd>
              </div>
            </dl>
          </article>
        `
      )
      .join("") || `<p class="empty">No orchestrator surfaces match the current scope.</p>`;

  nodes.orchestratorSetup.innerHTML = `
    <div class="setup-card">
      <p class="eyebrow">Setup Rules</p>
      <h3>How configuration should work</h3>
      <ul class="setup-list">
        <li>Agent templates stay platform-built and define allowed config fields.</li>
        <li>Agent instances stay workspace-scoped and are attached to workflows.</li>
        <li>Workflow templates define step order and allowed trigger types.</li>
        <li>Workflow instances activate schedules, webhooks, and workspace-specific parameters.</li>
        <li>Backend-backed editing comes later. This surface stays read-only until it can persist honestly.</li>
      </ul>
    </div>
  `;
}
