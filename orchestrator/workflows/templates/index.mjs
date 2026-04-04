import { contentPipeline } from "./content-pipeline.mjs";
import { leadQualification } from "./lead-qualification.mjs";

export const workflowTemplates = {
  [contentPipeline.id]: contentPipeline,
  [leadQualification.id]: leadQualification
};

export function getWorkflowTemplate(templateId) {
  return workflowTemplates[templateId] ?? null;
}
