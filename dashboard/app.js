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
const statusFilters = ["all", "running", "stopped", "error"];

const uiState = {
  workspaceId: "all",
  runId: state.runs[0]?.id ?? null,
  searchQuery: "",
  statusFilter: "all",
  copyFeedback: "",
  selectedAgentKey: ""
};

const workspaceSwitcher = document.querySelector("#workspace-switcher");
const metricsContainer = document.querySelector("#metrics");
const workflowGrid = document.querySelector("#workflow-grid");
const runList = document.querySelector("#run-list");
const runDetail = document.querySelector("#run-detail");
const agentFocus = document.querySelector("#agent-focus");
const modeBadge = document.querySelector("#mode-badge");
const generatedAt = document.querySelector("#generated-at");
const controlBar = document.querySelector("#control-bar");
const workspaceSpotlight = document.querySelector("#workspace-spotlight");
const commandDeck = document.querySelector("#command-deck");

const sectionNodes = {
  controlBar,
  workspaceSpotlight,
  commandDeck,
  workspaceSwitcher,
  metrics: metricsContainer,
  workflows: workflowGrid,
  agentFocus,
  runList,
  runDetail
};

function wait(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function nextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
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

function agentSelectionKey(workflowId, agentStepId) {
  return `${workflowId}::${agentStepId}`;
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

function getWorkflowById(workflowId) {
  return state.workflows.find((workflow) => workflow.id === workflowId) ?? null;
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

function matchesSearch(parts) {
  const search = normalize(uiState.searchQuery);

  if (!search) {
    return true;
  }

  return parts.some((part) => normalize(part).includes(search));
}

function filteredRuns() {
  return baseRuns().filter((run) => {
    const workflow = getWorkflowById(run.workflowInstanceId);

    return (
      (workflow ? matchesActivity(workflow) : true) &&
      matchesSearch([run.workflowName, run.workspaceName, run.summary, run.trigger, run.workflowTemplateId])
    );
  });
}

function filteredWorkflows() {
  return baseWorkflows().filter((workflow) =>
    matchesActivity(workflow) &&
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

function defaultAgentSelection() {
  const workflow = filteredWorkflows()[0] ?? null;
  const agentNode = workflow?.agentChain?.[0] ?? null;

  if (!workflow || !agentNode) {
    return "";
  }

  return agentSelectionKey(workflow.id, agentNode.id);
}

function selectedAgentContext() {
  const workflows = filteredWorkflows();

  for (const workflow of workflows) {
    for (const node of workflow.agentChain ?? []) {
      const key = agentSelectionKey(workflow.id, node.id);

      if (key === uiState.selectedAgentKey) {
        const latestRun = latestRunForWorkflow(workflow.id);
        const workflowActivity = getWorkflowActivity(workflow, latestRun);
        const agentState = getAgentNodeStatus(workflow, node, latestRun, workflowActivity);
        const latestStep =
          latestRun?.steps.find((step) => step.id === node.id) ??
          latestRun?.steps?.[(workflow.agentChain ?? []).findIndex((entry) => entry.id === node.id)] ??
          null;

        return {
          workflow,
          node,
          latestRun,
          latestStep,
          workflowActivity,
          agentState,
          selectionKey: key
        };
      }
    }
  }

  return null;
}

function ensureSelectedAgent() {
  if (selectedAgentContext()) {
    return;
  }

  uiState.selectedAgentKey = defaultAgentSelection();
}

function copyCommandLabel(commandId) {
  return uiState.copyFeedback === commandId ? "Copied" : "Copy";
}

function latestRunForWorkflow(workflowId) {
  return state.runs.find((run) => run.workflowInstanceId === workflowId) ?? null;
}

function getWorkflowActivity(workflow, latestRun = latestRunForWorkflow(workflow.id)) {
  if (!workflow.enabled) {
    return {
      state: "stopped",
      label: "Stopped",
      detail: "Workflow disabled",
      activeStepId: null
    };
  }

  if (workflow.lastRunStatus === "running") {
    const activeStep =
      latestRun?.steps.find((step) => step.status === "running") ??
      latestRun?.steps.find((step) => step.status === "queued") ??
      latestRun?.steps.at(0) ??
      null;

    return {
      state: "running",
      label: "Running",
      detail: activeStep ? `Working on ${activeStep.name}` : "Executing workflow",
      activeStepId: activeStep?.id ?? null
    };
  }

  if (workflow.lastRunStatus === "failed") {
    const blockedStep =
      latestRun?.steps.find((step) => step.status === "failed") ?? latestRun?.steps.at(-1) ?? null;

    return {
      state: "error",
      label: "Error",
      detail: blockedStep ? `Blocked on ${blockedStep.name}` : "Last run failed",
      activeStepId: blockedStep?.id ?? null
    };
  }

  return {
    state: "stopped",
    label: "Stopped",
    detail:
      latestRun
        ? "Ready for the next fire"
        : workflow.schedule
          ? `Waiting for ${workflow.schedule}`
          : "Waiting for first fire",
    activeStepId: null
  };
}

function getAgentNodeStatus(workflow, node, latestRun, workflowActivity) {
  const templateChain = workflow.agentChain ?? [];
  const chainIndex = templateChain.findIndex((entry) => entry.id === node.id);
  const latestStep =
    latestRun?.steps.find((step) => step.id === node.id) ?? latestRun?.steps?.[chainIndex] ?? null;
  const latestSteps = latestRun?.steps ?? [];
  const runningIndex = latestSteps.findIndex((step) => step.status === "running");
  const failedIndex = latestSteps.findIndex((step) => step.status === "failed");

  if (!workflow.enabled) {
    return { state: "stopped", detail: "Workflow disabled" };
  }

  if (workflowActivity.state === "running") {
    if (latestStep?.status === "running" || node.id === workflowActivity.activeStepId) {
      return { state: "running", detail: `Working on ${node.name}` };
    }

    if (latestStep?.status === "succeeded") {
      return { state: "stopped", detail: `Finished ${node.name}` };
    }

    if (runningIndex !== -1 && chainIndex > runningIndex) {
      return {
        state: "stopped",
        detail: `Queued after ${latestSteps[runningIndex]?.name ?? "active step"}`
      };
    }
  }

  if (workflowActivity.state === "error") {
    if (latestStep?.status === "failed" || chainIndex === failedIndex) {
      return { state: "error", detail: `Blocked on ${node.name}` };
    }

    if (latestStep?.status === "succeeded") {
      return { state: "stopped", detail: `Finished ${node.name}` };
    }

    return { state: "stopped", detail: "Waiting for recovery" };
  }

  if (latestStep?.status === "succeeded") {
    return {
      state: "stopped",
      detail:
        latestRun
          ? `Last finished ${node.name}`
          : "Ready for first execution"
    };
  }

  return {
    state: "stopped",
    detail:
      workflow.schedule
        ? "Waiting for scheduled wake-up"
        : "Waiting for manual fire"
  };
}

function matchesActivity(workflow) {
  if (uiState.statusFilter === "all") {
    return true;
  }

  return getWorkflowActivity(workflow).state === uiState.statusFilter;
}

function loaderMarkup(message, inline = false) {
  return `
    <div class="panel-loader">
      <div class="pulse-bars-loader ${inline ? "pulse-bars-loader--inline" : ""}" role="status" aria-live="polite">
        <div class="pulse-bars-loader__bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p class="pulse-bars-loader__text">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

function showSectionLoader(sectionName, message, inline = false) {
  sectionNodes[sectionName].innerHTML = loaderMarkup(message, inline);
}

function showScopeLoaders() {
  showSectionLoader("workspaceSpotlight", "Refreshing workspace context");
  showSectionLoader("commandDeck", "Refreshing operator commands");
  showSectionLoader("metrics", "Refreshing summary metrics");
  showSectionLoader("workflows", "Refreshing workflow surface");
  showSectionLoader("agentFocus", "Refreshing agent focus");
  showSectionLoader("runList", "Refreshing execution ledger");
  showSectionLoader("runDetail", "Refreshing run trace");
}

async function copyToClipboard(text, commandId, onComplete) {
  try {
    await navigator.clipboard.writeText(text);
    uiState.copyFeedback = commandId;
    onComplete?.();
    window.setTimeout(() => {
      if (uiState.copyFeedback === commandId) {
        uiState.copyFeedback = "";
        onComplete?.();
      }
    }, 1400);
  } catch (error) {
    console.error(error);
  }
}

function attachCopyHandlers(rootNode, onComplete) {
  rootNode.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      await copyToClipboard(button.dataset.copyCommand, button.dataset.commandId, onComplete);
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
    button.addEventListener("click", async () => {
      uiState.workspaceId = button.dataset.workspaceId;
      uiState.copyFeedback = "";
      ensureSelectedRun();
      renderWorkspaceSwitcher();
      await renderScopedSections();
    });
  });
}

function renderControlBar() {
  const runCounts = statusFilters.reduce((accumulator, status) => {
    accumulator[status] =
      status === "all"
        ? baseWorkflows().length
        : baseWorkflows().filter((workflow) => getWorkflowActivity(workflow).state === status).length;
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
  searchInput.addEventListener("input", async (event) => {
    uiState.searchQuery = event.target.value;
    ensureSelectedRun();
    await renderScopedSections();
  });

  controlBar.querySelectorAll("[data-status-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.statusFilter = button.dataset.statusFilter;
      ensureSelectedRun();
      renderControlBar();
      await renderScopedSections();
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
          Use this scope to compare tenant health, find noisy launch surfaces fast, and spot where execution pressure is drifting.
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

  attachCopyHandlers(commandDeck, renderCommandDeck);
}

function renderAgentFocus() {
  ensureSelectedAgent();
  const context = selectedAgentContext();

  if (!context) {
    agentFocus.innerHTML = `<p class="empty">Select an agent node to inspect what it is doing.</p>`;
    return;
  }

  const { workflow, node, latestRun, latestStep, workflowActivity, agentState } = context;
  const localCommand = `node orchestrator/run.mjs --workspace=${workflow.workspaceId} --workflow=${workflow.id}`;
  const cloudCommand = `gh workflow run orchestrator.yml -f workspace_id=${workflow.workspaceId} -f workflow_id=${workflow.id}`;
  const artifactPreview = latestStep?.artifact
    ? `<pre>${JSON.stringify(latestStep.artifact, null, 2)}</pre>`
    : `<p class="empty">No artifact yet for this agent.</p>`;

  agentFocus.innerHTML = `
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

  attachCopyHandlers(agentFocus, renderAgentFocus);
}

function renderWorkflows() {
  const workflows = filteredWorkflows();

  workflowGrid.innerHTML =
    workflows
      .map(
        (workflow) => {
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
        }
      )
      .join("") || `<p class="empty">No workflow instances match the current filter.</p>`;

  attachCopyHandlers(workflowGrid, renderWorkflows);
  workflowGrid.querySelectorAll("[data-agent-selection]").forEach((button) => {
    button.addEventListener("click", async () => {
      uiState.selectedAgentKey = button.dataset.agentSelection;
      showSectionLoader("agentFocus", "Loading agent focus");
      await nextPaint();
      renderWorkflows();
      renderAgentFocus();
    });
  });
  workflowGrid.querySelectorAll("[data-open-run]").forEach((button) => {
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
    button.addEventListener("click", async () => {
      uiState.runId = button.dataset.runId;
      showSectionLoader("runDetail", "Refreshing run trace");
      await nextPaint();
      renderRunList();
      renderRunDetail();
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

async function renderPrimarySections() {
  modeBadge.textContent = state.mode;
  generatedAt.textContent = displayDate(state.generatedAt);

  showSectionLoader("controlBar", "Priming operator controls");
  showSectionLoader("workspaceSpotlight", "Loading workspace context");
  showSectionLoader("commandDeck", "Preparing command deck");
  showSectionLoader("workspaceSwitcher", "Loading workspace scopes", true);
  showSectionLoader("metrics", "Summarizing telemetry");
  showSectionLoader("agentFocus", "Preparing agent focus");

  await nextPaint();
  renderWorkspaceSwitcher();
  renderControlBar();
  renderWorkspaceSpotlight();
  renderCommandDeck();
  renderMetrics();
}

async function renderScopedSections() {
  ensureSelectedRun();
  ensureSelectedAgent();
  showScopeLoaders();

  await nextPaint();
  renderWorkspaceSpotlight();
  renderCommandDeck();
  renderMetrics();

  await nextPaint();
  renderWorkflows();

  await nextPaint();
  renderAgentFocus();

  await nextPaint();
  renderRunList();

  await nextPaint();
  renderRunDetail();
}

async function bootstrap() {
  try {
    await wait(80);
    await renderPrimarySections();
    await renderScopedSections();
  } catch (error) {
    console.error(error);
    Object.values(sectionNodes).forEach((node) => {
      node.innerHTML = `<p class="empty">Dashboard section failed to load.</p>`;
    });
  }
}

bootstrap();
