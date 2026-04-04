import { getAgentTemplate } from "./catalog.mjs";
import { getStepHandler } from "../agents/handlers/index.mjs";
import { getExecutorAdapter } from "../executors/adapters/index.mjs";

export async function executeStep(step, context) {
  const handler = getStepHandler(step.handlerKey);

  if (!handler) {
    throw new Error(`No handler registered for ${step.handlerKey}.`);
  }

  const agent = getAgentTemplate(step.agentId);
  const executorId = step.executor ?? agent?.defaultRuntimeProfile?.executor ?? null;
  const adapter = getExecutorAdapter(executorId);

  if (!adapter) {
    throw new Error(`No executor adapter registered for ${executorId ?? "unknown-executor"}.`);
  }

  const result = await adapter.execute({
    step,
    context,
    handler,
    agent
  });

  return {
    ...result,
    executor: executorId,
    agentName: agent?.name ?? step.agentId
  };
}
