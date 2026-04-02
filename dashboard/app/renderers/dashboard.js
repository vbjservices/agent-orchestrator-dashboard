import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import {
  agentSelectionKey,
  filteredWorkflows,
  getAgentNodeStatus,
  getWorkflowActivity,
  getWorkspaceById,
  latestRunForWorkflow
} from "../model.js";

function workflowLaneMarkup(workflow) {
  const latestRun = latestRunForWorkflow(workflow.id);
  const workflowActivity = getWorkflowActivity(workflow, latestRun);
  const workspace = getWorkspaceById(workflow.workspaceId);
  const agentNodes =
    workflow.agentChain?.map((node) => {
      const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);

      return `
        <button
          class="workflow-lane__agent workflow-lane__agent--${agentState.state}"
          data-dashboard-agent="${agentSelectionKey(workflow.id, node.id)}"
          type="button"
        >
          <span class="workflow-lane__agent-head">
            ${agentAvatarMarkup("xs")}
            <strong>${node.agentName}</strong>
          </span>
          <small>${node.name}</small>
        </button>
      `;
    }).join("") ?? "";

  return `
    <article
      class="workflow-lane workflow-lane--${workflowActivity.state}"
      data-dashboard-workflow="${workflow.id}"
      role="button"
      tabindex="0"
      aria-label="Open ${workflow.name}"
    >
      <div class="workflow-lane__head">
        <div>
          <p class="workflow-lane__workspace">${workspace?.name ?? workflow.workspaceId}</p>
          <h3>${workflow.name}</h3>
        </div>
        <span class="live-state live-state--${workflowActivity.state}">
          <span class="live-state__orb"></span>
          <span>${workflowActivity.label}</span>
        </span>
      </div>
      <p class="workflow-lane__detail">${workflowActivity.detail}</p>
      <div class="workflow-lane__agents">
        ${agentNodes || `<p class="empty">No agent chain recorded yet.</p>`}
      </div>
      <div class="workflow-lane__foot">
        <span>${workflow.templateName}</span>
        <span>${workflow.schedule ?? "manual only"}</span>
      </div>
    </article>
  `;
}

export function renderDashboardWorkflowBoard({ renderAgentModal, renderWorkflowModal, renderRunList, renderRunDetail }) {
  const grouped = filteredWorkflows().reduce((accumulator, workflow) => {
    const workspace = getWorkspaceById(workflow.workspaceId);
    const groupId = workflow.workspaceId;
    const group = accumulator.get(groupId) ?? {
      id: groupId,
      name: workspace?.name ?? workflow.workspaceId,
      workflows: []
    };

    group.workflows.push(workflow);
    accumulator.set(groupId, group);
    return accumulator;
  }, new Map());

  nodes.dashboardWorkflowBoard.innerHTML =
    Array.from(grouped.values())
      .map(
        (group) => `
          <section class="workflow-column">
            <header class="workflow-column__head">
              <div>
                <p class="eyebrow">Workspace</p>
                <h3>${group.name}</h3>
              </div>
              <span class="workflow-column__count">${group.workflows.length} workflows</span>
            </header>
            <div class="workflow-column__stack">
              ${group.workflows.map((workflow) => workflowLaneMarkup(workflow)).join("")}
            </div>
          </section>
        `
      )
      .join("") || `<p class="empty">No workflows match the current dashboard scope.</p>`;

  nodes.dashboardWorkflowBoard.querySelectorAll("[data-dashboard-workflow]").forEach((lane) => {
    const openWorkflow = async () => {
      uiState.selectedWorkflowId = lane.dataset.dashboardWorkflow;
      uiState.isAgentModalOpen = false;
      uiState.isWorkflowModalOpen = true;
      nodes.agentModal.hidden = true;
      nodes.workflowModal.hidden = false;
      nodes.workflowModalContent.innerHTML = loaderMarkup("Loading workflow popup");
      await nextPaint();
      renderDashboardWorkflowBoard({ renderAgentModal, renderWorkflowModal, renderRunList, renderRunDetail });
      renderWorkflowModal({ renderRunList, renderRunDetail });
    };

    lane.addEventListener("click", openWorkflow);
    lane.addEventListener("keydown", async (event) => {
      if (event.target !== lane) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      await openWorkflow();
    });
  });

  nodes.dashboardWorkflowBoard.querySelectorAll("[data-dashboard-agent]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      uiState.selectedAgentKey = button.dataset.dashboardAgent;
      uiState.isWorkflowModalOpen = false;
      uiState.isAgentModalOpen = true;
      nodes.workflowModal.hidden = true;
      nodes.agentModal.hidden = false;
      nodes.agentModalContent.innerHTML = loaderMarkup("Loading agent popup");
      await nextPaint();
      renderAgentModal();
    });

    button.addEventListener("keydown", (event) => {
      event.stopPropagation();
    });
  });
}
