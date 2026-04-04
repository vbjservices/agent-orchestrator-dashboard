export const ideaGenerator = {
  id: "idea-generator",
  name: "Idea Generator",
  category: "creative",
  responsibility: "Turn research into concrete angles and hooks.",
  sopPath: "knowledge/sops/content-pipeline/generate-angles.md",
  defaultRuntimeProfile: {
    executor: "simulated-codex",
    provider: "simulated",
    tier: "standard"
  },
  requiredInputs: ["research-signals", "campaignTheme", "callToAction"],
  outputArtifactKind: "angle-board",
  allowedConfigFields: ["angleCount", "tone", "platform"]
};
