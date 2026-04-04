import { nodes, uiState } from "../context.js";
import { displayDate, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import { contentResearchSnapshot } from "../model.js";

function platformBadge(platformId) {
  const labels = {
    tt: "TT",
    ig: "IG",
    yt: "YT"
  };

  return `
    <span class="research-platform research-platform--${platformId}">
      ${labels[platformId] ?? platformId.toUpperCase()}
    </span>
  `;
}

function topicTable(snapshot) {
  if (!snapshot.topics.length) {
    return `<p class="empty">No content research signals match the current scope.</p>`;
  }

  const rows = snapshot.topics
    .map(
      (topic) => `
        <tr>
          <td>
            <strong>${topic.title}</strong>
            <small>${topic.workspaceName} / ${displayDate(topic.updatedAt)}</small>
          </td>
          <td>
            <strong>${topic.hookAngle}</strong>
            <small>${topic.sourceSignal}</small>
          </td>
          <td>
            <div class="research-platform-strip">
              ${topic.platforms.map(platformBadge).join("")}
            </div>
          </td>
          <td>
            <span class="research-potential research-potential--${topic.potentialState}">
              ${topic.potentialLabel}
            </span>
          </td>
          <td>
            <button
              class="launch-action launch-action--ghost"
              data-open-research-workflow="${topic.workflowId}"
              type="button"
            >
              Open workflow
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <table class="research-table">
      <thead>
        <tr>
          <th>Topic</th>
          <th>Hook angle</th>
          <th>Platform</th>
          <th>Potential</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function competitorCards(snapshot) {
  if (!snapshot.competitors.length) {
    return `<p class="empty">Competitor pulse needs tracked workspace competitors in scope.</p>`;
  }

  return snapshot.competitors
    .map(
      (entry) => `
        <article class="competitor-card competitor-card--${entry.platform}">
          <div class="competitor-card__head">
            <div>
              <h3>${entry.handle}</h3>
              <small>${entry.workspaceName}</small>
              <span class="research-platform research-platform--${entry.platform}">${entry.platform}</span>
            </div>
            <strong>${entry.followersLabel}</strong>
          </div>
          <dl class="competitor-card__meta">
            <div>
              <dt>Frequency</dt>
              <dd>${entry.frequency}</dd>
            </div>
            <div>
              <dt>Style</dt>
              <dd>${entry.style}</dd>
            </div>
          </dl>
          <div class="competitor-card__angles">
            <p>Recent top angles</p>
            <ul>
              ${entry.topAngles.map((angle) => `<li>${angle}</li>`).join("")}
            </ul>
          </div>
          <div class="competitor-card__formula">
            <p>Signature formula</p>
            <strong>${entry.signatureFormula}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function ideaBank(snapshot) {
  if (!snapshot.ideas.length) {
    return `<p class="empty">Idea bank will populate after research and ideation runs are generated.</p>`;
  }

  return snapshot.ideas
    .map(
      (idea) => `
        <article class="idea-bank-card">
          <div class="idea-bank-card__head">
            <span class="idea-bank-card__badge">${idea.platformBadge}</span>
            <small>${displayDate(idea.updatedAt)}</small>
          </div>
          <p class="idea-bank-card__title">${idea.title}</p>
          <div class="idea-bank-card__foot">
            <small>${idea.workspaceName}</small>
            <small>${idea.pipelineLabel}</small>
          </div>
        </article>
      `
    )
    .join("");
}

export function renderContentResearch({ renderWorkflowModal, renderRunList, renderRunDetail }) {
  const snapshot = contentResearchSnapshot();

  nodes.researchTopics.innerHTML = topicTable(snapshot);
  nodes.researchCompetitors.innerHTML = competitorCards(snapshot);
  nodes.researchIdeaBank.innerHTML = ideaBank(snapshot);

  nodes.researchTopics.querySelectorAll("[data-open-research-workflow]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedWorkflowId = button.dataset.openResearchWorkflow;
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
