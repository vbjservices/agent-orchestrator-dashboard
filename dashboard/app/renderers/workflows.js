import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, displayDate, escapeHtml, nextPaint } from "../lib.js";
import { attachCopyHandlers, loaderMarkup, showSectionLoader } from "../loaders.js";
import {
  agentSelectionKey,
  copyCommandLabel,
  filteredWorkflows,
  getAgentNodeStatus,
  getWorkflowActivity,
  latestRunForWorkflow,
  selectedAgentContext,
  selectedWorkflowContext
} from "../model.js";

export function initializeAgentModal({ renderAgentModal }) {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !uiState.isAgentModalOpen) {
      return;
    }

    uiState.isAgentModalOpen = false;
    renderAgentModal();
  });

  nodes.agentModal?.querySelectorAll("[data-close-agent-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.isAgentModalOpen = false;
      renderAgentModal();
    });
  });
}

export function initializeWorkflowModal({ renderWorkflowModal, renderRunList, renderRunDetail }) {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !uiState.isWorkflowModalOpen) {
      return;
    }

    uiState.isWorkflowModalOpen = false;
    renderWorkflowModal({ renderRunList, renderRunDetail });
  });

  nodes.workflowModal?.querySelectorAll("[data-close-workflow-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.isWorkflowModalOpen = false;
      renderWorkflowModal({ renderRunList, renderRunDetail });
    });
  });
}

export function renderAgentModal() {
  const context = selectedAgentContext();

  if (!uiState.isAgentModalOpen || !context) {
    nodes.agentModal.hidden = true;
    nodes.agentModalContent.innerHTML = "";
    return;
  }

  const { workflow, node, latestRun, latestStep, workflowActivity, agentState } = context;
  const localCommand = `node orchestrator/run.mjs --workspace=${workflow.workspaceId} --workflow=${workflow.id}`;
  const cloudCommand = `gh workflow run orchestrator.yml -f workspace_id=${workflow.workspaceId} -f workflow_id=${workflow.id}`;
  const artifactPreview = latestStep?.artifact
    ? `<pre>${JSON.stringify(latestStep.artifact, null, 2)}</pre>`
    : `<p class="empty">No artifact yet for this agent.</p>`;

  nodes.agentModal.hidden = false;
  nodes.agentModalContent.innerHTML = `
    <div class="agent-modal__card">
      <div class="agent-modal__head">
        <div class="agent-modal__identity">
          ${agentAvatarMarkup("lg")}
          <div>
            <p class="eyebrow">Agent Focus</p>
            <h3 id="agent-modal-title">${node.agentName}</h3>
          </div>
        </div>
        <span class="live-state live-state--${agentState.state}">
          <span class="live-state__orb"></span>
          <span>${agentState.state}</span>
        </span>
      </div>
      <p class="agent-modal__body">${agentState.detail}</p>
      <dl class="agent-modal__meta">
        <div>
          <dt>Workflow</dt>
          <dd>${workflow.name}</dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>${node.name}</dd>
        </div>
        <div>
          <dt>Workspace</dt>
          <dd>${workflow.workspaceId}</dd>
        </div>
        <div>
          <dt>Workflow status</dt>
          <dd>${workflowActivity.label}</dd>
        </div>
        <div>
          <dt>Trigger mode</dt>
          <dd>${workflow.triggerMode.replaceAll("_", " / ")}</dd>
        </div>
        <div>
          <dt>Last finished</dt>
          <dd>${displayDate(latestStep?.finishedAt ?? latestRun?.finishedAt ?? null)}</dd>
        </div>
      </dl>
      <div class="agent-modal__actions">
        <button
          class="launch-action"
          data-command-id="focus-local-${workflow.id}"
          data-copy-command="${escapeHtml(localCommand)}"
        >
          ${copyCommandLabel(`focus-local-${workflow.id}`) === "Copied" ? "Local copied" : "Fire local"}
        </button>
        <button
          class="launch-action"
          data-command-id="focus-cloud-${workflow.id}"
          data-copy-command="${escapeHtml(cloudCommand)}"
        >
          ${copyCommandLabel(`focus-cloud-${workflow.id}`) === "Copied" ? "Cloud copied" : "Fire cloud"}
        </button>
      </div>
      <div class="agent-modal__artifact">
        <p class="eyebrow">Latest artifact</p>
        ${artifactPreview}
      </div>
    </div>
  `;

  attachCopyHandlers(nodes.agentModalContent, renderAgentModal);
}

export function renderWorkflowModal({ renderRunList, renderRunDetail }) {
  const context = selectedWorkflowContext();

  if (!uiState.isWorkflowModalOpen || !context) {
    nodes.workflowModal.hidden = true;
    nodes.workflowModalContent.innerHTML = "";
    return;
  }

  const { workflow, latestRun, workflowActivity } = context;
  const localCommand = `node orchestrator/run.mjs --workspace=${workflow.workspaceId} --workflow=${workflow.id}`;
  const cloudCommand = `gh workflow run orchestrator.yml -f workspace_id=${workflow.workspaceId} -f workflow_id=${workflow.id}`;
  const latestSummary = latestRun?.summary ?? "No run has completed for this workflow yet.";
  const agentChain =
    workflow.agentChain?.length
      ? workflow.agentChain
          .map((node) => {
            const selectionKey = agentSelectionKey(workflow.id, node.id);
            const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);

            return `
              <button
                class="workflow-modal__chain-node workflow-modal__chain-node--${agentState.state}"
                data-agent-selection="${selectionKey}"
                type="button"
              >
                ${agentAvatarMarkup("xs")}
                <div>
                  <strong>${node.agentName}</strong>
                  <small>${node.name}</small>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="empty">No agent chain has been recorded yet.</p>`;

  nodes.workflowModal.hidden = false;
  nodes.workflowModalContent.innerHTML = `
    <div class="workflow-modal__card">
      <div class="workflow-modal__head">
        <div class="workflow-modal__identity">
          <div>
            <p class="eyebrow">Workflow Focus</p>
            <h3 id="workflow-modal-title">${workflow.name}</h3>
          </div>
        </div>
        <span class="live-state live-state--${workflowActivity.state}">
          <span class="live-state__orb"></span>
          <span>${workflowActivity.label}</span>
        </span>
      </div>
      <div class="workflow-modal__artifact">
        <p class="eyebrow">Agent chain</p>
        <div class="workflow-modal__chain">${agentChain}</div>
      </div>
      <p class="workflow-modal__body">${workflow.description}</p>
      <p class="workflow-modal__summary">${workflowActivity.detail}</p>
      <dl class="workflow-modal__meta">
        <div>
          <dt>Workspace</dt>
          <dd>${workflow.workspaceId}</dd>
        </div>
        <div>
          <dt>Template</dt>
          <dd>${workflow.templateName}</dd>
        </div>
        <div>
          <dt>Trigger</dt>
          <dd>${workflow.triggerMode.replaceAll("_", " / ")}</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>${workflow.schedule ?? "manual only"}</dd>
        </div>
        <div>
          <dt>Last run</dt>
          <dd>${displayDate(workflow.lastRunAt)}</dd>
        </div>
        <div>
          <dt>Last result</dt>
          <dd>${workflow.lastRunStatus}</dd>
        </div>
      </dl>
      <div class="workflow-modal__actions">
        <button
          class="launch-action"
          data-command-id="workflow-local-${workflow.id}"
          data-copy-command="${escapeHtml(localCommand)}"
        >
          ${copyCommandLabel(`workflow-local-${workflow.id}`) === "Copied" ? "Local copied" : "Fire local"}
        </button>
        <button
          class="launch-action"
          data-command-id="workflow-cloud-${workflow.id}"
          data-copy-command="${escapeHtml(cloudCommand)}"
        >
          ${copyCommandLabel(`workflow-cloud-${workflow.id}`) === "Copied" ? "Cloud copied" : "Fire cloud"}
        </button>
        <button
          class="launch-action launch-action--ghost"
          data-open-workflow-run="${latestRun?.id ?? ""}"
          ${latestRun ? "" : "disabled"}
        >
          Open latest
        </button>
      </div>
      <div class="workflow-modal__artifact">
        <p class="eyebrow">Latest run summary</p>
        <p class="workflow-modal__summary-text">${latestSummary}</p>
      </div>
    </div>
  `;

  attachCopyHandlers(nodes.workflowModalContent, () => renderWorkflowModal({ renderRunList, renderRunDetail }));
  nodes.workflowModalContent.querySelectorAll("[data-open-workflow-run]").forEach((button) => {
    button.addEventListener("click", async () => {
      const runId = button.dataset.openWorkflowRun;

      if (!runId) {
        return;
      }

      uiState.runId = runId;
      uiState.isWorkflowModalOpen = false;
      showSectionLoader("runDetail", "Opening latest run");
      await nextPaint();
      renderWorkflowModal({ renderRunList, renderRunDetail });
      renderRunList();
      renderRunDetail();
    });
  });

  nodes.workflowModalContent.querySelectorAll("[data-agent-selection]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedAgentKey = button.dataset.agentSelection;
      uiState.isWorkflowModalOpen = false;
      uiState.isAgentModalOpen = true;
      nodes.workflowModal.hidden = true;
      nodes.agentModal.hidden = false;
      nodes.agentModalContent.innerHTML = loaderMarkup("Loading agent popup");
      await nextPaint();
      renderWorkflowModal({ renderRunList, renderRunDetail });
      renderAgentModal();
    });
  });
}

export function renderWorkflows({ renderAgentModal, renderWorkflowModal, renderRunList, renderRunDetail }) {
  const workflows = filteredWorkflows();

  nodes.workflowGrid.innerHTML =
    workflows
      .map((workflow) => {
        const latestRun = latestRunForWorkflow(workflow.id);
        const workflowActivity = getWorkflowActivity(workflow, latestRun);

        return `
          <article
            class="workflow-card workflow-card--launch"
            data-open-workflow-modal="${workflow.id}"
            role="button"
            tabindex="0"
            aria-label="Open ${workflow.name}"
          >
            <div class="workflow-card__head">
              <div>
                <p class="workflow-card__tenant">${workflow.workspaceId}</p>
                <h3>${workflow.name}</h3>
              </div>
              <span class="live-state live-state--${workflowActivity.state}">
                <span class="live-state__orb"></span>
                <span>${workflowActivity.label}</span>
              </span>
            </div>
            <div class="workflow-card__summary">
              <p class="workflow-card__body workflow-card__body--compact">${workflow.description}</p>
              <p class="workflow-card__runtime-text">${workflowActivity.detail}</p>
            </div>
            <div class="workflow-card__stats">
              <span>${workflow.agentChain?.length ?? 0} agents</span>
              <span>${workflow.templateName}</span>
            </div>
            <div class="workflow-card__footer">
              <small class="workflow-card__footnote">
                ${latestRun ? `Last run ${displayDate(workflow.lastRunAt)}` : workflow.schedule ?? "manual only"}
              </small>
              <small class="workflow-card__footnote">Click to inspect</small>
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty">No workflow instances match the current filter.</p>`;

  nodes.workflowGrid.querySelectorAll("[data-open-workflow-modal]").forEach((button) => {
    const openWorkflow = async () => {
      uiState.selectedWorkflowId = button.dataset.openWorkflowModal;
      uiState.isAgentModalOpen = false;
      uiState.isWorkflowModalOpen = true;
      nodes.agentModal.hidden = true;
      nodes.workflowModal.hidden = false;
      nodes.workflowModalContent.innerHTML = loaderMarkup("Loading workflow popup");
      await nextPaint();
      renderWorkflows({ renderAgentModal, renderWorkflowModal, renderRunDetail, renderRunList });
      renderWorkflowModal({ renderRunList, renderRunDetail });
    };

    button.addEventListener("click", openWorkflow);
    button.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      await openWorkflow();
    });
  });
}
