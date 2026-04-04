import { getStepHandler } from "../agents/handlers/index.mjs";
import { getExecutorAdapter } from "../executors/adapters/index.mjs";
import { agentTemplates, getAgentTemplate, getWorkflowTemplate, workflowTemplates } from "./catalog.mjs";

function assertContract(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateAgentTemplate(agent) {
  assertContract(typeof agent.id === "string" && agent.id.length > 0, "Agent template is missing a valid id.");
  assertContract(typeof agent.name === "string" && agent.name.length > 0, `Agent ${agent.id} is missing a valid name.`);
  assertContract(
    typeof agent.sopPath === "string" && agent.sopPath.startsWith("knowledge/sops/"),
    `Agent ${agent.id} is missing a valid SOP path.`
  );
  assertContract(
    Array.isArray(agent.requiredInputs) && agent.requiredInputs.length > 0,
    `Agent ${agent.id} is missing required input contracts.`
  );
  assertContract(
    Array.isArray(agent.allowedConfigFields),
    `Agent ${agent.id} is missing allowed config field contracts.`
  );
  assertContract(
    typeof agent.outputArtifactKind === "string" && agent.outputArtifactKind.length > 0,
    `Agent ${agent.id} is missing an output artifact contract.`
  );
  assertContract(
    typeof agent.defaultRuntimeProfile?.executor === "string" &&
      Boolean(getExecutorAdapter(agent.defaultRuntimeProfile.executor)),
    `Agent ${agent.id} references an unknown executor adapter.`
  );
}

function validateWorkflowTemplate(workflow) {
  assertContract(
    typeof workflow.id === "string" && workflow.id.length > 0,
    "Workflow template is missing a valid id."
  );
  assertContract(
    typeof workflow.sopDirectory === "string" && workflow.sopDirectory.startsWith("knowledge/sops/"),
    `Workflow ${workflow.id} is missing a valid SOP directory.`
  );
  assertContract(
    Array.isArray(workflow.supportedTriggerModes) && workflow.supportedTriggerModes.length > 0,
    `Workflow ${workflow.id} is missing supported trigger modes.`
  );
  assertContract(
    Array.isArray(workflow.instanceConfigFields),
    `Workflow ${workflow.id} is missing instance config contracts.`
  );

  for (const step of workflow.steps) {
    assertContract(getAgentTemplate(step.agentId), `Workflow ${workflow.id} step ${step.id} references an unknown agent.`);
    assertContract(getStepHandler(step.handlerKey), `Workflow ${workflow.id} step ${step.id} references an unknown handler.`);
    assertContract(Boolean(getExecutorAdapter(step.executor)), `Workflow ${workflow.id} step ${step.id} references an unknown executor.`);
  }
}

export function validateCatalogContracts() {
  agentTemplates.forEach(validateAgentTemplate);
  Object.values(workflowTemplates).forEach(validateWorkflowTemplate);
}

function validateTriggerMode(workspace, workflowInstance, workflowTemplate) {
  assertContract(
    workflowTemplate.supportedTriggerModes.includes(workflowInstance.triggerMode),
    `Workflow instance ${workflowInstance.id} in ${workspace.id} uses unsupported trigger mode ${workflowInstance.triggerMode}.`
  );

  const expectsSchedule = workflowInstance.triggerMode.includes("schedule");

  if (expectsSchedule) {
    assertContract(
      typeof workflowInstance.schedule === "string" && workflowInstance.schedule.length > 0,
      `Workflow instance ${workflowInstance.id} in ${workspace.id} requires a schedule.`
    );
    return;
  }

  assertContract(
    workflowInstance.schedule === null || workflowInstance.schedule === undefined,
    `Workflow instance ${workflowInstance.id} in ${workspace.id} should not define a schedule.`
  );
}

export function validateWorkspaceContracts(workspaces) {
  for (const workspace of workspaces) {
    for (const workflowInstance of workspace.workflowInstances ?? []) {
      const workflowTemplate = getWorkflowTemplate(workflowInstance.template);
      assertContract(
        Boolean(workflowTemplate),
        `Workspace ${workspace.id} references an unknown workflow template: ${workflowInstance.template}.`
      );

      validateTriggerMode(workspace, workflowInstance, workflowTemplate);
    }
  }
}

export function validateContracts(workspaces) {
  validateCatalogContracts();
  validateWorkspaceContracts(workspaces);
}
