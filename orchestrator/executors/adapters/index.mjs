import { simulatedCodexAdapter } from "./simulated-codex.mjs";

export const executorAdapters = {
  [simulatedCodexAdapter.id]: simulatedCodexAdapter
};

export function getExecutorAdapter(adapterId) {
  return executorAdapters[adapterId] ?? null;
}
