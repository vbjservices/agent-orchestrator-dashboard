export const dmAutomation = {
  id: "dm-automation",
  name: "DM Automation",
  category: "sales",
  responsibility: "Draft a follow-up response tied to lead quality.",
  sopPath: "knowledge/sops/lead-qualification/draft-response.md",
  defaultRuntimeProfile: {
    executor: "simulated-codex",
    provider: "simulated",
    tier: "standard"
  },
  requiredInputs: ["score-lead", "sampleLead"],
  outputArtifactKind: "dm-response",
  allowedConfigFields: ["tone", "followUpWindowHours"]
};
