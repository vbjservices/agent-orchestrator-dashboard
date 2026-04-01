import { promises as fs } from "node:fs";
import path from "node:path";

const statePrefix = "window.__ORCHESTRATOR_STATE__ = ";

export async function loadState(statePath) {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const normalized = raw.trim();

    if (!normalized.startsWith(statePrefix)) {
      throw new Error("Unexpected state file format.");
    }

    const json = normalized.slice(statePrefix.length).replace(/;$/, "");
    return JSON.parse(json);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeState(statePath, state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  const payload = `${statePrefix}${JSON.stringify(state, null, 2)};\n`;
  await fs.writeFile(statePath, payload, "utf8");
}
