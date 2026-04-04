export const scriptWriter = {
  id: "script-writer",
  name: "Script Writer",
  category: "creative",
  responsibility: "Convert a winning angle into a usable output.",
  sopPath: "knowledge/sops/content-pipeline/draft-script.md",
  defaultRuntimeProfile: {
    executor: "simulated-codex",
    provider: "simulated",
    tier: "standard"
  },
  requiredInputs: ["generate-angles", "campaignTheme", "callToAction"],
  outputArtifactKind: "draft-script",
  allowedConfigFields: ["durationSeconds", "format", "callToAction"]
};
