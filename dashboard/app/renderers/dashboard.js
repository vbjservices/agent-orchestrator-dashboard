import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import { dashboardAiTeams } from "../model.js";

export function renderAiTeam({ renderAgentModal }) {
  const teams = dashboardAiTeams();
  if (nodes.dashboardAiTeamCount) {
    nodes.dashboardAiTeamCount.textContent = `- ${teams.length} agents`;
  }

  nodes.dashboardAiTeam.innerHTML =
    teams
      .map(
        (team) => `
          <button
            class="team-card team-card--${team.state}"
            data-ai-team="${team.primarySelectionKey}"
            type="button"
          >
            <div class="team-card__head">
              <div class="team-card__identity">
                ${agentAvatarMarkup("md")}
                <div>
                  <p class="team-card__role">${team.category}</p>
                  <h3>${team.name}</h3>
                </div>
              </div>
              <span class="status-chip status-chip--${team.state}">${team.state}</span>
            </div>
            <p class="team-card__body">${team.detail}</p>
            <div class="team-card__progress">
              <div class="team-card__progress-head">
                <span>Processing</span>
                <strong>${team.progress}%</strong>
              </div>
              <div class="team-card__progress-track" aria-hidden="true">
                <span style="width: ${team.progress}%"></span>
              </div>
            </div>
            <dl class="team-card__meta">
              <div>
                <dt>Workflows</dt>
                <dd>${team.workflowCount}</dd>
              </div>
              <div>
                <dt>Workspaces</dt>
                <dd>${team.workspaceCount}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>${team.outputArtifactKind}</dd>
              </div>
            </dl>
          </button>
        `
      )
      .join("") || `<p class="empty">No AI team surfaces match the current dashboard scope.</p>`;

  nodes.dashboardAiTeam.querySelectorAll("[data-ai-team]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!button.dataset.aiTeam) {
        return;
      }

      uiState.selectedAgentKey = button.dataset.aiTeam;
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
