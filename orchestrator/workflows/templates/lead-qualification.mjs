export const leadQualification = {
  id: "lead-qualification",
  name: "Lead Qualification",
  description: "Score an inbound lead and draft the right follow-up path.",
  supportedTriggerModes: ["manual_only"],
  sopDirectory: "knowledge/sops/lead-qualification",
  instanceConfigFields: ["qualificationThreshold", "sampleLead"],
  steps: [
    {
      id: "score-lead",
      name: "Score Lead",
      agentId: "lead-qualifier",
      executor: "simulated-codex",
      handlerKey: "lead-score"
    },
    {
      id: "draft-response",
      name: "Draft Response",
      agentId: "dm-automation",
      executor: "simulated-codex",
      handlerKey: "dm-reply"
    }
  ]
};
