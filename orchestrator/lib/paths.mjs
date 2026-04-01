import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(currentDir, "..", "..");

export const defaultPaths = {
  workspaceConfigDir: path.join(repoRoot, "config", "workspaces"),
  outputStatePath: path.join(repoRoot, "dashboard", "data", "state.js"),
  runtimeDir: path.join(repoRoot, "runtime")
};
