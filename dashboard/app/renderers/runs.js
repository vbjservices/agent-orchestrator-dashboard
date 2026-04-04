import { nodes, uiState } from "../context.js";
import { agentAvatarMarkup, currency, displayDate, durationBetween, nextPaint } from "../lib.js";
import { showSectionLoader } from "../loaders.js";
import { filteredRuns, selectedRun } from "../model.js";

function agentTone(agentName) {
  const normalized = String(agentName ?? "").trim().toLowerCase();

  if (normalized.includes("research")) {
    return "research";
  }

  if (normalized.includes("idea")) {
    return "idea";
  }

  if (normalized.includes("script")) {
    return "script";
  }

  if (normalized.includes("editor")) {
    return "editor";
  }

  if (normalized.includes("scheduler")) {
    return "scheduler";
  }

  if (normalized.includes("analytic")) {
    return "analytics";
  }

  if (normalized.includes("lead")) {
    return "lead";
  }

  if (normalized.includes("dm")) {
    return "dm";
  }

  return "default";
}

export function renderRunList({ renderRunDetail }) {
  const runs = filteredRuns();

  nodes.runList.innerHTML =
    runs
      .map((run) => {
        const leadAgent = run.steps.at(-1)?.agentName ?? run.workflowName;
        const tone = agentTone(leadAgent);

        return `
          <button
            class="run-row run-row--${run.status} ${run.id === selectedRun()?.id ? "is-selected" : ""}"
            data-run-id="${run.id}"
          >
            <div class="run-row__head">
              <small>${displayDate(run.finishedAt)}</small>
              <span class="status-chip status-chip--${run.status}">${run.status}</span>
            </div>
            <p class="run-row__title run-row__title--${tone}">${leadAgent}</p>
            <p class="run-row__summary">${run.summary}</p>
            <div class="run-row__foot">
              <small>${run.workflowName}</small>
              <small>${run.workspaceName}</small>
            </div>
          </button>
        `;
      })
      .join("") || `<p class="empty">No runs available for this scope.</p>`;

  nodes.runList.querySelectorAll("[data-run-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.runId = button.dataset.runId;
      showSectionLoader("runDetail", "Refreshing run trace");
      await nextPaint();
      renderRunList({ renderRunDetail });
      renderRunDetail();
    });
  });
}

export function renderRunDetail() {
  const run = selectedRun();

  if (!run) {
    nodes.runDetail.innerHTML = `<p class="empty">Run detail will appear after the first matching execution.</p>`;
    return;
  }

  const stepPills = run.steps
    .map(
      (step) => `
        <span class="step-pill">
          <span class="step-pill__agent">
            ${agentAvatarMarkup("xs")}
            <span>${step.agentName}</span>
          </span>
          <small>${step.name}</small>
        </span>
      `
    )
    .join("");

  const steps = run.steps
    .map(
      (step) => `
        <article class="step-card">
          <div class="step-card__head">
            <div class="step-card__identity">
              <p class="step-card__agent">
                ${agentAvatarMarkup("sm")}
                <span>${step.agentName}</span>
              </p>
              <h3>${step.name}</h3>
            </div>
            <span class="status-chip status-chip--${step.status}">${step.status}</span>
          </div>
          <div class="step-card__meta">
            <span>${step.executor}</span>
            <span>${displayDate(step.finishedAt)}</span>
          </div>
          <p class="step-card__summary">${step.summary}</p>
          <details class="artifact-details">
            <summary>Inspect artifact payload</summary>
            <pre>${JSON.stringify(step.artifact, null, 2)}</pre>
          </details>
        </article>
      `
    )
    .join("");

  const logLines = run.logs.map((line) => `<li>${line}</li>`).join("");

  nodes.runDetail.innerHTML = `
    <div class="run-summary">
      <div>
        <p class="eyebrow">Run summary</p>
        <h3>${run.workflowName}</h3>
      </div>
      <div class="run-summary__meta">
        <span class="status-chip status-chip--${run.status}">${run.status}</span>
        <span>${run.trigger}</span>
        <span>${currency(run.costEstimateUsd)}</span>
      </div>
    </div>
    <p class="run-summary__text">${run.summary}</p>
    <dl class="run-summary-grid">
      <div>
        <dt>Workspace</dt>
        <dd>${run.workspaceName}</dd>
      </div>
      <div>
        <dt>Started</dt>
        <dd>${displayDate(run.startedAt)}</dd>
      </div>
      <div>
        <dt>Finished</dt>
        <dd>${displayDate(run.finishedAt)}</dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>${durationBetween(run.startedAt, run.finishedAt)}</dd>
      </div>
      <div>
        <dt>Steps</dt>
        <dd>${run.steps.length}</dd>
      </div>
      <div>
        <dt>Template</dt>
        <dd>${run.workflowTemplateId}</dd>
      </div>
    </dl>
    <div class="step-pill-row">${stepPills}</div>
    <div class="step-stack">${steps}</div>
    <div class="log-panel">
      <p class="eyebrow">Logs</p>
      <ul>${logLines}</ul>
    </div>
  `;
}
