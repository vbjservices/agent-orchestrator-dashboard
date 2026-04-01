import { nodes, uiState } from "../context.js";
import { displayDate, escapeHtml, nextPaint } from "../lib.js";
import { attachCopyHandlers, showSectionLoader } from "../loaders.js";
import {
  agentSelectionKey,
  copyCommandLabel,
  ensureSelectedAgent,
  filteredWorkflows,
  getAgentNodeStatus,
  getWorkflowActivity,
  latestRunForWorkflow,
  selectedAgentContext
} from "../model.js";

export function renderAgentFocus() {
  ensureSelectedAgent();
  const context = selectedAgentContext();

  if (!context) {
    nodes.agentFocus.innerHTML = `<p class="empty">Select an agent node to inspect what it is doing.</p>`;
    return;
  }

  const { workflow, node, latestRun, latestStep, workflowActivity, agentState } = context;
  const localCommand = `node orchestrator/run.mjs --workspace=${workflow.workspaceId} --workflow=${workflow.id}`;
  const cloudCommand = `gh workflow run orchestrator.yml -f workspace_id=${workflow.workspaceId} -f workflow_id=${workflow.id}`;
  const artifactPreview = latestStep?.artifact
    ? `<pre>${JSON.stringify(latestStep.artifact, null, 2)}</pre>`
    : `<p class="empty">No artifact yet for this agent.</p>`;

  nodes.agentFocus.innerHTML = `
    <div class="agent-focus__card">
      <div class="agent-focus__head">
        <div>
          <p class="eyebrow">Agent Focus</p>
          <h3>${node.agentName}</h3>
        </div>
        <span class="live-state live-state--${agentState.state}">
          <span class="live-state__orb"></span>
          <span>${agentState.state}</span>
        </span>
      </div>
      <p class="agent-focus__body">${agentState.detail}</p>
      <dl class="agent-focus__meta">
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
      <div class="agent-focus__actions">
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
      <div class="agent-focus__artifact">
        <p class="eyebrow">Latest artifact</p>
        ${artifactPreview}
      </div>
    </div>
  `;

  attachCopyHandlers(nodes.agentFocus, renderAgentFocus);
}

export function renderWorkflows({ renderAgentFocus, renderRunList, renderRunDetail }) {
  const workflows = filteredWorkflows();

  nodes.workflowGrid.innerHTML =
    workflows
      .map((workflow) => {
        const latestRun = latestRunForWorkflow(workflow.id);
        const workflowActivity = getWorkflowActivity(workflow, latestRun);
        const localCommand = `node orchestrator/run.mjs --workspace=${workflow.workspaceId} --workflow=${workflow.id}`;
        const cloudCommand = `gh workflow run orchestrator.yml -f workspace_id=${workflow.workspaceId} -f workflow_id=${workflow.id}`;
        const agentNodes =
          workflow.agentChain?.length
            ? workflow.agentChain
                .map((node) => {
                  const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);
                  const selectionKey = agentSelectionKey(workflow.id, node.id);

                  return `
                    <button
                      class="agent-node agent-node--${agentState.state} ${uiState.selectedAgentKey === selectionKey ? "is-selected" : ""}"
                      data-agent-selection="${selectionKey}"
                    >
                      <div class="agent-node__head">
                        <span>${node.agentName}</span>
                        <span class="live-state live-state--${agentState.state}">
                          <span class="live-state__orb"></span>
                          <span>${agentState.state}</span>
                        </span>
                      </div>
                      <small>${node.name}</small>
                    </button>
                  `;
                })
                .join("")
            : `
              <span class="agent-node agent-node--ghost">
                <span>Unrun workflow</span>
                <small>Agent chain unavailable</small>
              </span>
            `;

        return `
          <article class="workflow-card workflow-card--launch">
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
            <p class="workflow-card__body">${workflow.description}</p>
            <div class="workflow-card__runtime">
              <p class="workflow-card__runtime-text">${workflowActivity.detail}</p>
            </div>
            <div class="workflow-card__launch">
              <p class="workflow-card__launch-label">Agent chain</p>
              <div class="workflow-card__agents">${agentNodes}</div>
            </div>
            <dl class="workflow-card__meta">
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
            <div class="workflow-card__actions">
              <button
                class="launch-action"
                data-command-id="launch-local-${workflow.id}"
                data-copy-command="${escapeHtml(localCommand)}"
              >
                ${copyCommandLabel(`launch-local-${workflow.id}`) === "Copied" ? "Local copied" : "Fire local"}
              </button>
              <button
                class="launch-action"
                data-command-id="launch-cloud-${workflow.id}"
                data-copy-command="${escapeHtml(cloudCommand)}"
              >
                ${copyCommandLabel(`launch-cloud-${workflow.id}`) === "Copied" ? "Cloud copied" : "Fire cloud"}
              </button>
              <button
                class="launch-action launch-action--ghost"
                data-open-run="${latestRun?.id ?? ""}"
                ${latestRun ? "" : "disabled"}
              >
                Open latest
              </button>
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty">No workflow instances match the current filter.</p>`;

  attachCopyHandlers(nodes.workflowGrid, () =>
    renderWorkflows({ renderAgentFocus, renderRunDetail, renderRunList })
  );

  nodes.workflowGrid.querySelectorAll("[data-agent-selection]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedAgentKey = button.dataset.agentSelection;
      showSectionLoader("agentFocus", "Loading agent focus");
      await nextPaint();
      renderWorkflows({ renderAgentFocus, renderRunDetail, renderRunList });
      renderAgentFocus();
    });
  });

  nodes.workflowGrid.querySelectorAll("[data-open-run]").forEach((button) => {
    button.addEventListener("click", async () => {
      const runId = button.dataset.openRun;

      if (!runId) {
        return;
      }

      uiState.runId = runId;
      showSectionLoader("runDetail", "Opening latest run");
      await nextPaint();
      renderRunList();
      renderRunDetail();
    });
  });
}
