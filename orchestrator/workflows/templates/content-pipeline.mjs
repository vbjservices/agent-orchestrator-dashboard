export const contentPipeline = {
  id: "content-pipeline",
  name: "Content Pipeline",
  description: "Research, ideation, and scripting for a tenant-specific campaign theme.",
  supportedTriggerModes: ["manual_or_schedule"],
  sopDirectory: "knowledge/sops/content-pipeline",
  instanceConfigFields: ["campaignTheme", "callToAction", "schedule"],
  steps: [
    {
      id: "research-signals",
      name: "Research Signals",
      agentId: "content-researcher",
      executor: "simulated-codex",
      handlerKey: "research"
    },
    {
      id: "generate-angles",
      name: "Generate Angles",
      agentId: "idea-generator",
      executor: "simulated-codex",
      handlerKey: "angles"
    },
    {
      id: "draft-script",
      name: "Draft Script",
      agentId: "script-writer",
      executor: "simulated-codex",
      handlerKey: "script"
    }
  ]
};
