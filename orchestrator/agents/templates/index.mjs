import { contentResearcher } from "./content-researcher.mjs";
import { ideaGenerator } from "./idea-generator.mjs";
import { scriptWriter } from "./script-writer.mjs";
import { leadQualifier } from "./lead-qualifier.mjs";
import { dmAutomation } from "./dm-automation.mjs";

export const agentTemplates = [
  contentResearcher,
  ideaGenerator,
  scriptWriter,
  leadQualifier,
  dmAutomation
];

const agentTemplateMap = new Map(agentTemplates.map((agent) => [agent.id, agent]));

export function getAgentTemplate(agentId) {
  return agentTemplateMap.get(agentId) ?? null;
}
