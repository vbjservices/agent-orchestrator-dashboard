import { generateAngles } from "./angles.mjs";
import { draftDmReply } from "./dm-reply.mjs";
import { scoreLead } from "./lead-score.mjs";
import { summarizeResearch } from "./research.mjs";
import { draftScript } from "./script.mjs";

export const stepHandlers = {
  research: summarizeResearch,
  angles: generateAngles,
  script: draftScript,
  "lead-score": scoreLead,
  "dm-reply": draftDmReply
};

export function getStepHandler(handlerKey) {
  return stepHandlers[handlerKey] ?? null;
}
