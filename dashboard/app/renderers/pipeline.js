import { nodes, uiState } from "../context.js";
import { displayDate, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import { contentPipelineBoard } from "../model.js";

function laneCardMarkup(item, tone) {
  return `
    <button
      class="pipeline-card pipeline-card--${tone}"
      data-open-pipeline-workflow="${item.workflowInstanceId}"
      type="button"
    >
      <div class="pipeline-card__head">
        <span class="pipeline-card__state">Derived</span>
        <small>${displayDate(item.updatedAt)}</small>
      </div>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="pipeline-card__tags">
        ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <div class="pipeline-card__foot">
        <small>${item.workflowName}</small>
        <small>${item.workspaceName}</small>
      </div>
    </button>
  `;
}

export function renderContentPipeline({ renderWorkflowModal, renderRunList, renderRunDetail }) {
  const board = contentPipelineBoard();

  nodes.pipelineBoard.innerHTML =
    board.lanes
      .map(
        (lane) => `
          <section class="pipeline-lane pipeline-lane--${lane.tone}">
            <div class="pipeline-lane__head">
              <div>
                <p class="eyebrow">${lane.label}</p>
                <h3>${lane.count}</h3>
              </div>
              <span class="pipeline-lane__badge">
                ${lane.count} ${lane.count === 1 ? "item" : "items"}
              </span>
            </div>
            <div class="pipeline-lane__stack">
              ${
                lane.items.length
                  ? lane.items.map((item) => laneCardMarkup(item, lane.tone)).join("")
                  : `<p class="pipeline-lane__empty">${lane.emptyMessage}</p>`
              }
            </div>
          </section>
        `
      )
      .join("") || `<p class="empty">No content pipeline items match the current scope.</p>`;

  nodes.pipelineBoard.querySelectorAll("[data-open-pipeline-workflow]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedWorkflowId = button.dataset.openPipelineWorkflow;
      uiState.isAgentModalOpen = false;
      uiState.isWorkflowModalOpen = true;
      nodes.agentModal.hidden = true;
      nodes.workflowModal.hidden = false;
      nodes.workflowModalContent.innerHTML = loaderMarkup("Loading workflow popup");
      await nextPaint();
      renderWorkflowModal({ renderRunList, renderRunDetail });
    });
  });
}
