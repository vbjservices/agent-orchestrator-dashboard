export const leadQualifier = {
  id: "lead-qualifier",
  name: "Lead Qualifier",
  category: "sales",
  responsibility: "Score inbound demand before sales time is spent.",
  sopPath: "knowledge/sops/lead-qualification/score-lead.md",
  defaultRuntimeProfile: {
    executor: "simulated-codex",
    provider: "simulated",
    tier: "standard"
  },
  requiredInputs: ["sampleLead", "qualificationThreshold"],
  outputArtifactKind: "lead-score",
  allowedConfigFields: ["qualificationThreshold", "routingMode"]
};
