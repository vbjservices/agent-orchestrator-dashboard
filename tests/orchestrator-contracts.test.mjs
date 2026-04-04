import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { existsSync } from "node:fs";

import { agentTemplates } from "../orchestrator/agents/templates/index.mjs";
import { getStepHandler } from "../orchestrator/agents/handlers/index.mjs";
import { workflowTemplates } from "../orchestrator/workflows/templates/index.mjs";
import { getExecutorAdapter } from "../orchestrator/executors/adapters/index.mjs";
import { loadWorkspaces } from "../orchestrator/lib/workspace-loader.mjs";
import { defaultPaths, repoRoot } from "../orchestrator/lib/paths.mjs";
import { validateContracts } from "../orchestrator/lib/validation.mjs";

test("agent templates expose runtime and SOP contracts", () => {
  for (const agent of agentTemplates) {
    assert.equal(typeof agent.id, "string");
    assert.equal(typeof agent.name, "string");
    assert.equal(typeof agent.sopPath, "string");
    assert.ok(agent.sopPath.startsWith("knowledge/sops/"));
    assert.equal(existsSync(path.join(repoRoot, agent.sopPath)), true);
    assert.equal(agent.defaultRuntimeProfile.executor, "simulated-codex");
    assert.ok(getExecutorAdapter(agent.defaultRuntimeProfile.executor));
    assert.ok(Array.isArray(agent.requiredInputs));
    assert.ok(agent.requiredInputs.length > 0);
    assert.ok(Array.isArray(agent.allowedConfigFields));
  }
});

test("workflow steps resolve to agent templates and handler contracts", () => {
  const agentIds = new Set(agentTemplates.map((agent) => agent.id));

  for (const workflow of Object.values(workflowTemplates)) {
    assert.ok(Array.isArray(workflow.supportedTriggerModes));
    assert.ok(Array.isArray(workflow.instanceConfigFields));
    assert.equal(typeof workflow.sopDirectory, "string");
    assert.ok(workflow.sopDirectory.startsWith("knowledge/sops/"));
    assert.equal(existsSync(path.join(repoRoot, workflow.sopDirectory)), true);

    for (const step of workflow.steps) {
      assert.ok(agentIds.has(step.agentId));
      assert.ok(getStepHandler(step.handlerKey));
      assert.ok(getExecutorAdapter(step.executor));
    }
  }
});

test("workspace configs respect runtime contracts", async () => {
  const workspaces = await loadWorkspaces(defaultPaths.workspaceConfigDir);
  assert.doesNotThrow(() => validateContracts(workspaces));
});
