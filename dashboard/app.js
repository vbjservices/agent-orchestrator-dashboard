const fallbackState = {
  generatedAt: null,
  mode: "uninitialized",
  stats: {
    workspaceCount: 0,
    workflowCount: 0,
    runCount: 0,
    successRate: 0,
    totalCostEstimateUsd: 0
  },
  workspaces: [],
  workflows: [],
  runs: [],
  agents: []
};

const state = window.__ORCHESTRATOR_STATE__ ?? fallbackState;

const uiState = {
  workspaceId: "all",
  runId: state.runs[0]?.id ?? null
};

const workspaceSwitcher = document.querySelector("#workspace-switcher");
const metricsContainer = document.querySelector("#metrics");
const workflowGrid = document.querySelector("#workflow-grid");
const runList = document.querySelector("#run-list");
const runDetail = document.querySelector("#run-detail");
const modeBadge = document.querySelector("#mode-badge");
const generatedAt = document.querySelector("#generated-at");

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value);
}

function displayDate(value) {
  if (!value) {
    return "not generated";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function filteredRuns() {
  if (uiState.workspaceId === "all") {
    return state.runs;
  }

  return state.runs.filter((run) => run.workspaceId === uiState.workspaceId);
}

function filteredWorkflows() {
  if (uiState.workspaceId === "all") {
    return state.workflows;
  }

  return state.workflows.filter((workflow) => workflow.workspaceId === uiState.workspaceId);
}

function selectedRun() {
  const runs = filteredRuns();
  return runs.find((run) => run.id === uiState.runId) ?? runs[0] ?? null;
}

function renderWorkspaceSwitcher() {
  const buttons = [
    {
      id: "all",
      name: "All workspaces",
      vertical: `${state.workspaces.length} tenants loaded`
    },
    ...state.workspaces
  ]
    .map(
      (workspace) => `
        <button class="workspace-pill ${workspace.id === uiState.workspaceId ? "is-active" : ""}" data-workspace-id="${workspace.id}">
          <span>${workspace.name}</span>
          <small>${workspace.vertical}</small>
        </button>
      `
    )
    .join("");

  workspaceSwitcher.innerHTML = buttons || `<p class="empty">No workspaces configured.</p>`;

  workspaceSwitcher.querySelectorAll("[data-workspace-id]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.workspaceId = button.dataset.workspaceId;
      uiState.runId = filteredRuns()[0]?.id ?? null;
      render();
    });
  });
}

function renderMetrics() {
  const runs = filteredRuns();
  const workflows = filteredWorkflows();
  const successfulRuns = runs.filter((run) => run.status === "succeeded").length;
  const successRate = runs.length === 0 ? 0 : Math.round((successfulRuns / runs.length) * 100);
  const totalCost = runs.reduce((sum, run) => sum + run.costEstimateUsd, 0);
  const activeWorkspaces =
    uiState.workspaceId === "all"
      ? state.workspaces.length
      : state.workspaces.filter((workspace) => workspace.id === uiState.workspaceId).length;

  const cards = [
    ["Workspaces", String(activeWorkspaces), "Tenants currently in view"],
    ["Workflow instances", String(workflows.length), "Code-defined workflows ready to run"],
    ["Success rate", `${successRate}%`, "Based on retained run history"],
    ["Estimated cost", currency(totalCost), "Simulated worker cost across visible runs"]
  ];

  metricsContainer.innerHTML = cards
    .map(
      ([label, value, meta]) => `
        <article class="metric-card">
          <p>${label}</p>
          <strong>${value}</strong>
          <span>${meta}</span>
        </article>
      `
    )
    .join("");
}

function renderWorkflows() {
  const workflows = filteredWorkflows();

  workflowGrid.innerHTML =
    workflows
      .map(
        (workflow) => `
          <article class="workflow-card">
            <div class="workflow-card__head">
              <div>
                <p class="workflow-card__tenant">${workflow.workspaceId}</p>
                <h3>${workflow.name}</h3>
              </div>
              <span class="status-chip status-chip--${workflow.lastRunStatus}">${workflow.lastRunStatus}</span>
            </div>
            <p class="workflow-card__body">${workflow.description}</p>
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
                <dt>Steps</dt>
                <dd>${workflow.stepCount}</dd>
              </div>
            </dl>
          </article>
        `
      )
      .join("") || `<p class="empty">No workflow instances match the current filter.</p>`;
}

function renderRunList() {
  const runs = filteredRuns();

  runList.innerHTML =
    runs
      .map(
        (run) => `
          <button class="run-row ${run.id === selectedRun()?.id ? "is-selected" : ""}" data-run-id="${run.id}">
            <div>
              <p>${run.workflowName}</p>
              <small>${run.workspaceName}</small>
            </div>
            <div>
              <span class="status-chip status-chip--${run.status}">${run.status}</span>
              <small>${displayDate(run.finishedAt)}</small>
            </div>
          </button>
        `
      )
      .join("") || `<p class="empty">No runs available for this workspace.</p>`;

  runList.querySelectorAll("[data-run-id]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.runId = button.dataset.runId;
      renderRunDetail();
      renderRunList();
    });
  });
}

function renderRunDetail() {
  const run = selectedRun();

  if (!run) {
    runDetail.innerHTML = `<p class="empty">Run detail will appear after the first successful execution.</p>`;
    return;
  }

  const steps = run.steps
    .map(
      (step) => `
        <article class="step-card">
          <div class="step-card__head">
            <div>
              <p>${step.agentName}</p>
              <h3>${step.name}</h3>
            </div>
            <span class="status-chip status-chip--${step.status}">${step.status}</span>
          </div>
          <p class="step-card__summary">${step.summary}</p>
          <pre>${JSON.stringify(step.artifact, null, 2)}</pre>
        </article>
      `
    )
    .join("");

  const logLines = run.logs.map((line) => `<li>${line}</li>`).join("");

  runDetail.innerHTML = `
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
    <div class="step-stack">${steps}</div>
    <div class="log-panel">
      <p class="eyebrow">Logs</p>
      <ul>${logLines}</ul>
    </div>
  `;
}

function render() {
  modeBadge.textContent = state.mode;
  generatedAt.textContent = displayDate(state.generatedAt);
  renderWorkspaceSwitcher();
  renderMetrics();
  renderWorkflows();
  renderRunList();
  renderRunDetail();
}

render();
