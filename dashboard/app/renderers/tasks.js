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
            data-task-agent="${entry.primarySelectionKey ?? ""}"
            type="button"
            ${entry.primarySelectionKey ? "" : "disabled"}
          >
            <div class="task-status-card__head">
              <div class="task-status-card__identity">
                ${agentAvatarMarkup("md", {
                  agentId: entry.agentId,
                  agentName: entry.agentName,
                  category: entry.category
                })}
                <div>
                  <p class="task-status-card__role">${entry.category}</p>
                  <h3>${entry.agentName}</h3>
                </div>
              </div>
              <span class="status-chip status-chip--${entry.state}">${entry.state}</span>
            </div>
            <div class="task-status-card__task">
              <p class="task-status-card__label">${entry.taskLabel}</p>
              <p class="task-status-card__body">${entry.primaryTaskTitle}</p>
              <p class="task-status-card__detail">${entry.primaryTaskDetail}</p>
              <p class="task-status-card__context">${entry.primaryTaskContext}</p>
            </div>
            <div class="task-status-card__progress">
              <div class="task-status-card__progress-head">
                <span>Execution load</span>
                <strong>${entry.progress}%</strong>
              </div>
              <div class="task-status-card__progress-track" aria-hidden="true">
                <span style="width: ${entry.progress}%"></span>
              </div>
            </div>
            <div class="task-status-card__next">
              <span>Up next</span>
              <strong>${entry.nextTaskTitle}</strong>
              <small>${entry.nextTaskContext}</small>
            </div>
            <dl class="task-status-card__meta">
              <div>
                <dt>Queued</dt>
                <dd>${entry.queuedCount}</dd>
              </div>
              <div>
                <dt>Workflows</dt>
                <dd>${entry.workflowCount}</dd>
              </div>
              <div>
                <dt>Workspaces</dt>
                <dd>${entry.workspaceCount}</dd>
              </div>
            </dl>
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
                        ${agentAvatarMarkup("xs", {
                          agentId: task.agentId,
                          agentName: task.agentName,
                          category: task.category
                        })}
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
