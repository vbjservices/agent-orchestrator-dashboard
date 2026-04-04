import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, displayDate, nextPaint } from "../lib.js";
import { loaderMarkup } from "../loaders.js";
import { taskActivityFeed, taskAgentStatusCards, prioritizedAgentTasks } from "../model.js";

function taskActivityTone(agentName) {
  const normalized = String(agentName ?? "").toLowerCase();

  if (normalized.includes("research")) {
    return "research";
  }

  if (normalized.includes("idea")) {
    return "idea";
  }

  if (normalized.includes("script")) {
    return "script";
  }

  if (normalized.includes("lead")) {
    return "lead";
  }

  if (normalized.includes("dm")) {
    return "dm";
  }

  return "default";
}

export function renderAgentTasks({ renderAgentModal }) {
  const agentCards = taskAgentStatusCards();
  const tasks = prioritizedAgentTasks();
  const activity = taskActivityFeed();

  nodes.taskAgentGrid.innerHTML =
    agentCards
      .map(
        (entry) => `
          <button
            class="task-status-card task-status-card--${entry.state}"
            data-task-agent="${entry.orderedTasks[0]?.selectionKey ?? ""}"
            type="button"
            ${entry.orderedTasks[0]?.selectionKey ? "" : "disabled"}
          >
            <div class="task-status-card__head">
              <div class="task-status-card__identity">
                ${agentAvatarMarkup("md")}
                <div>
                  <p class="task-status-card__role">${entry.category}</p>
                  <h3>${entry.agentName}</h3>
                </div>
              </div>
              <span class="status-chip status-chip--${entry.state}">${entry.state}</span>
            </div>
            <p class="task-status-card__body">${entry.nextTaskTitle}</p>
            <p class="task-status-card__detail">${entry.nextTaskDetail}</p>
            <div class="task-status-card__progress">
              <div class="task-status-card__progress-head">
                <span>Workload</span>
                <strong>${entry.progress}%</strong>
              </div>
              <div class="task-status-card__progress-track" aria-hidden="true">
                <span style="width: ${entry.progress}%"></span>
              </div>
            </div>
            <dl class="task-status-card__meta">
              <div>
                <dt>Queued</dt>
                <dd>${entry.queuedCount}</dd>
              </div>
              <div>
                <dt>Running</dt>
                <dd>${entry.runningCount}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>${entry.blockedCount}</dd>
              </div>
            </dl>
            <ol class="task-status-card__order">
              ${entry.orderedTasks
                .map(
                  (task) => `
                    <li>
                      <span>${task.order}</span>
                      <strong>${task.stepName}</strong>
                    </li>
                  `
                )
                .join("")}
            </ol>
          </button>
        `
      )
      .join("") || `<p class="empty">No agent workloads match the current scope.</p>`;

  nodes.taskQueue.innerHTML =
    tasks.length > 0
      ? `
        <table class="task-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Task</th>
              <th>Agent</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Workflow</th>
              <th>Workspace</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (task) => `
                  <tr
                    class="task-table__row task-table__row--${task.state}"
                    data-task-agent-row="${task.selectionKey}"
                    role="button"
                    tabindex="0"
                  >
                    <td>${task.order}</td>
                    <td>
                      <strong>${task.title}</strong>
                      <small>${task.detail}</small>
                    </td>
                    <td>
                      <span class="task-table__agent">
                        ${agentAvatarMarkup("xs")}
                        <span>${task.agentName}</span>
                      </span>
                    </td>
                    <td>
                      <span class="task-priority task-priority--${task.priorityState}">${task.priorityLabel}</span>
                    </td>
                    <td>
                      <span class="status-chip status-chip--${task.state}">${task.statusLabel}</span>
                    </td>
                    <td>${task.workflowName}</td>
                    <td>${task.workspaceId}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<p class="empty">No prioritized tasks match the current scope.</p>`;

  nodes.taskActivity.innerHTML =
    activity
      .map(
        (entry) => `
          <article class="task-activity-row">
            <div class="task-activity-row__head">
              <small>${displayDate(entry.finishedAt)}</small>
              <span class="status-chip status-chip--${entry.status}">${entry.status}</span>
            </div>
            <p class="task-activity-row__title task-activity-row__title--${taskActivityTone(entry.agentName)}">${entry.agentName}</p>
            <p class="task-activity-row__summary">${entry.summary}</p>
            <div class="task-activity-row__foot">
              <small>${entry.workflowName}</small>
              <small>${entry.workspaceName}</small>
            </div>
          </article>
        `
      )
      .join("") || `<p class="empty">No recent task activity is available.</p>`;

  nodes.taskAgentGrid.querySelectorAll("[data-task-agent]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!button.dataset.taskAgent) {
        return;
      }

      uiState.selectedAgentKey = button.dataset.taskAgent;
      uiState.isWorkflowModalOpen = false;
      uiState.isAgentModalOpen = true;
      nodes.workflowModal.hidden = true;
      nodes.agentModal.hidden = false;
      nodes.agentModalContent.innerHTML = loaderMarkup("Loading agent popup");
      await nextPaint();
      renderAgentModal();
    });
  });

  nodes.taskQueue.querySelectorAll("[data-task-agent-row]").forEach((row) => {
    const openAgent = async () => {
      uiState.selectedAgentKey = row.dataset.taskAgentRow;
      uiState.isWorkflowModalOpen = false;
      uiState.isAgentModalOpen = true;
      nodes.workflowModal.hidden = true;
      nodes.agentModal.hidden = false;
      nodes.agentModalContent.innerHTML = loaderMarkup("Loading agent popup");
      await nextPaint();
      renderAgentModal();
    };

    row.addEventListener("click", openAgent);
    row.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      await openAgent();
    });
  });
}
