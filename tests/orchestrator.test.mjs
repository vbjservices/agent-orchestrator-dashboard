import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";

import { runOrchestrator } from "../orchestrator/lib/runner.mjs";

function parseStateSource(source) {
  const prefix = "window.__ORCHESTRATOR_STATE__ = ";
  return JSON.parse(source.trim().slice(prefix.length).replace(/;$/, ""));
}

test("runOrchestrator writes a dashboard state file for one workspace", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-orchestrator-"));
  const outputStatePath = path.join(tempDir, "state.js");
  const runtimeDir = path.join(tempDir, "runtime");

  const result = await runOrchestrator({
    workspaceId: "vbj-services",
    trigger: "manual",
    paths: {
      outputStatePath,
      runtimeDir
    }
  });

  assert.ok(result.runs.length >= 1);

  const stateSource = await readFile(outputStatePath, "utf8");
  const state = parseStateSource(stateSource);

  assert.equal(state.mode, "file-backed-v1");
  assert.equal(state.workspaces.some((workspace) => workspace.id === "vbj-services"), true);
  assert.equal(state.runs.every((run) => run.status === "succeeded"), true);
  assert.equal(state.runs.every((run) => run.workspaceId === "vbj-services"), true);
});
