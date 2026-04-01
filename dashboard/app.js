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
const statusFilters = ["all", "succeeded", "running", "failed", "idle"];

const uiState = {
  workspaceId: "all",
  runId: state.runs[0]?.id ?? null,
  searchQuery: "",
  statusFilter: "all",
  copyFeedback: ""
};

const workspaceSwitcher = document.querySelector("#workspace-switcher");
const metricsContainer = document.querySelector("#metrics");
const workflowGrid = document.querySelector("#workflow-grid");
const runList = document.querySelector("#run-list");
const runDetail = document.querySelector("#run-detail");
const modeBadge = document.querySelector("#mode-badge");
const generatedAt = document.querySelector("#generated-at");
const dashboardLoader = document.querySelector("#dashboard-loader");
const dashboardLoaderMessage = document.querySelector("#dashboard-loader-message");
const controlBar = document.querySelector("#control-bar");
const workspaceSpotlight = document.querySelector("#workspace-spotlight");
const commandDeck = document.querySelector("#command-deck");

function setLoading(message = "Syncing orchestrator state") {
  dashboardLoaderMessage.textContent = message;
  dashboardLoader.classList.remove("is-hidden");
}

function clearLoading() {
  dashboardLoader.classList.add("is-hidden");
}

function wait(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value ?? 0);
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

function durationBetween(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) {
    return "n/a";
  }

  const milliseconds = Math.max(new Date(finishedAt) - new Date(startedAt), 0);
  const seconds = Math.round(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function currentWorkspace() {
  return state.workspaces.find((workspace) => workspace.id === uiState.workspaceId) ?? null;
}

function baseRuns() {
  if (uiState.workspaceId === "all") {
    return state.runs;
  }

  return state.runs.filter((run) => run.workspaceId === uiState.workspaceId);
}

function baseWorkflows() {
  if (uiState.workspaceId === "all") {
    return state.workflows;
  }

  return state.workflows.filter((workflow) => workflow.workspaceId === uiState.workspaceId);
}

function matchesStatus(status) {
  return uiState.statusFilter === "all" || status === uiState.statusFilter;
}

function matchesSearch(parts) {
  const search = normalize(uiState.searchQuery);

  if (!search) {
    return true;
  }

  return parts.some((part) => normalize(part).includes(search));
}

function filteredRuns() {
  return baseRuns().filter((run) =>
    matchesStatus(run.status) &&
    matchesSearch([run.workflowName, run.workspaceName, run.summary, run.trigger, run.workflowTemplateId])
  );
}

function filteredWorkflows() {
  return baseWorkflows().filter((workflow) =>
    matchesStatus(workflow.lastRunStatus) &&
    matchesSearch([
      workflow.name,
      workflow.workspaceId,
      workflow.templateName,
      workflow.description,
      workflow.triggerMode
    ])
  );
}

function selectedRun() {
  const runs = filteredRuns();
  return runs.find((run) => run.id === uiState.runId) ?? runs[0] ?? null;
}

function ensureSelectedRun() {
  const activeRun = selectedRun();
  uiState.runId = activeRun?.id ?? null;
}

function copyCommandLabel(commandId) {
  return uiState.copyFeedback === commandId ? "Copied" : "Copy";
}

async function copyToClipboard(text, commandId) {
  try {
    await navigator.clipboard.writeText(text);
    uiState.copyFeedback = commandId;
    renderCommandDeck();
    window.setTimeout(() => {
      if (uiState.copyFeedback === commandId) {
        uiState.copyFeedback = "";
        renderCommandDeck();
      }
    }, 1400);
  } catch (error) {
    console.error(error);
  }
}

function attachCopyHandlers() {
  commandDeck.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      await copyToClipboard(button.dataset.copyCommand, button.dataset.commandId);
    });
  });
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
      uiState.copyFeedback = "";
      ensureSelectedRun();
      render();
    });
  });
}

function renderControlBar() {
  const runCounts = statusFilters.reduce((accumulator, status) => {
    accumulator[status] =
      status === "all"
        ? baseRuns().length
        : status === "idle"
          ? baseWorkflows().filter((workflow) => workflow.lastRunStatus === "idle").length
          : baseRuns().filter((run) => run.status === status).length;
    return accumulator;
  }, {});

  controlBar.innerHTML = `
    <div class="operator-controls">
      <label class="search-field">
        <span class="search-field__label">Search workflows and runs</span>
        <input
          id="search-query"
          type="search"
          value="${escapeHtml(uiState.searchQuery)}"
          placeholder="Search by workflow, tenant, trigger, or summary"
          autocomplete="off"
        />
      </label>
      <div class="filter-strip">
        ${statusFilters
          .map(
            (status) => `
              <button
                class="filter-pill ${uiState.statusFilter === status ? "is-active" : ""}"
                data-status-filter="${status}"
              >
                <span>${status}</span>
                <small>${runCounts[status] ?? 0}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  const searchInput = controlBar.querySelector("#search-query");
  searchInput.addEventListener("input", (event) => {
    uiState.searchQuery = event.target.value;
    ensureSelectedRun();
    render();
  });

  controlBar.querySelectorAll("[data-status-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.statusFilter = button.dataset.statusFilter;
      ensureSelectedRun();
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
    ["Workspaces", String(activeWorkspaces), "Tenants currently in scope"],
    ["Workflow instances", String(workflows.length), "Filtered operator-ready workflows"],
    ["Success rate", `${successRate}%`, "Run health inside the active scope"],
    ["Estimated cost", currency(totalCost), "Visible run cost estimate"]
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

function renderWorkspaceSpotlight() {
  const workspace = currentWorkspace();

  if (!workspace) {
    const totalGoals = state.workspaces.flatMap((entry) => entry.goals ?? []).slice(0, 3);

    workspaceSpotlight.innerHTML = `
      <div class="spotlight-card">
        <div class="spotlight-card__head">
          <div>
            <p class="eyebrow">All tenants</p>
            <h3>Cross-workspace operator view</h3>
          </div>
          <span class="status-chip status-chip--${uiState.statusFilter}">${uiState.statusFilter}</span>
        </div>
        <p class="spotlight-card__body">
          Use this scope to compare tenant health, find noisy workflows fast, and spot where the run surface is drifting.
        </p>
        <dl class="spotlight-card__meta">
          <div>
            <dt>Tenants</dt>
            <dd>${state.workspaces.length}</dd>
          </div>
          <div>
            <dt>Runs in scope</dt>
            <dd>${filteredRuns().length}</dd>
          </div>
          <div>
            <dt>Last refresh</dt>
            <dd>${displayDate(state.generatedAt)}</dd>
          </div>
          <div>
            <dt>Platform mode</dt>
            <dd>${state.mode}</dd>
          </div>
        </dl>
        <ul class="spotlight-list">
          ${totalGoals.map((goal) => `<li>${goal}</li>`).join("")}
        </ul>
      </div>
    `;
    return;
  }

  workspaceSpotlight.innerHTML = `
    <div class="spotlight-card">
      <div class="spotlight-card__head">
        <div>
          <p class="eyebrow">${workspace.vertical}</p>
          <h3>${workspace.name}</h3>
        </div>
        <span class="status-chip status-chip--succeeded">${workspace.plan}</span>
      </div>
      <p class="spotlight-card__body">
        ${workspace.idealCustomerProfile}
      </p>
      <dl class="spotlight-card__meta">
        <div>
          <dt>Timezone</dt>
          <dd>${workspace.timezone}</dd>
        </div>
        <div>
          <dt>Active workflows</dt>
          <dd>${workspace.activeWorkflowCount}</dd>
        </div>
        <div>
          <dt>Total runs</dt>
          <dd>${workspace.totalRuns}</dd>
        </div>
        <div>
          <dt>Success rate</dt>
          <dd>${workspace.successRate}%</dd>
        </div>
      </dl>
      <ul class="spotlight-list">
        ${(workspace.goals ?? []).map((goal) => `<li>${goal}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderCommandDeck() {
  const workspace = currentWorkspace();
  const runCommand =
    workspace ? `node orchestrator/run.mjs --workspace=${workspace.id}` : "node orchestrator/run.mjs";
  const workflowDispatchCommand = workspace
    ? `gh workflow run orchestrator.yml -f workspace_id=${workspace.id}`
    : "gh workflow run orchestrator.yml";
  const inspectCommand = "Get-Content runtime\\last-run.json";

  const commands = [
    {
      id: "local-run",
      title: "Local run",
      description: "Fastest way to refresh state while iterating on workflows.",
      command: runCommand
    },
    {
      id: "actions-run",
      title: "GitHub dispatch",
      description: "Manual cloud-side execution for the current scope.",
      command: workflowDispatchCommand
    },
    {
      id: "inspect-snapshot",
      title: "Inspect snapshot",
      description: "View the most recent runtime payload directly from disk.",
      command: inspectCommand
    }
  ];

  commandDeck.innerHTML = `
    <div class="command-stack">
      ${commands
        .map(
          (item) => `
            <article class="command-card">
              <div class="command-card__head">
                <div>
                  <p class="eyebrow">${item.title}</p>
                  <h3>${item.command}</h3>
                </div>
                <button
                  class="copy-button"
                  data-command-id="${item.id}"
                  data-copy-command="${escapeHtml(item.command)}"
                >
                  ${copyCommandLabel(item.id)}
                </button>
              </div>
              <p class="command-card__body">${item.description}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  attachCopyHandlers();
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
                <dt>Last run</dt>
                <dd>${displayDate(workflow.lastRunAt)}</dd>
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
            <div class="run-row__main">
              <p>${run.workflowName}</p>
              <small>${run.workspaceName}</small>
            </div>
            <div class="run-row__side">
              <span class="status-chip status-chip--${run.status}">${run.status}</span>
              <small>${displayDate(run.finishedAt)}</small>
              <small>${currency(run.costEstimateUsd)}</small>
            </div>
          </button>
        `
      )
      .join("") || `<p class="empty">No runs available for this scope.</p>`;

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
    runDetail.innerHTML = `<p class="empty">Run detail will appear after the first matching execution.</p>`;
    return;
  }

  const stepPills = run.steps
    .map(
      (step) => `
        <span class="step-pill">
          <span>${step.name}</span>
          <small>${step.agentName}</small>
        </span>
      `
    )
    .join("");

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

function render() {
  ensureSelectedRun();
  modeBadge.textContent = state.mode;
  generatedAt.textContent = displayDate(state.generatedAt);
  renderWorkspaceSwitcher();
  renderControlBar();
  renderWorkspaceSpotlight();
  renderCommandDeck();
  renderMetrics();
  renderWorkflows();
  renderRunList();
  renderRunDetail();
}

async function bootstrap() {
  try {
    setLoading(state.generatedAt ? "Loading run telemetry" : "Waiting for orchestrator state");
    await wait(320);
    render();
    clearLoading();
  } catch (error) {
    console.error(error);
    setLoading("Dashboard boot failed");
  }
}

bootstrap();
