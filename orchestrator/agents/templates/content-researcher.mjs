export const contentResearcher = {
  id: "content-researcher",
  name: "Content Researcher",
  category: "research",
  responsibility: "Find positioning signals, objections, and trend hooks.",
  sopPath: "knowledge/sops/content-pipeline/research-signals.md",
  defaultRuntimeProfile: {
    executor: "simulated-codex",
    provider: "simulated",
    tier: "standard"
  },
  requiredInputs: ["campaignTheme", "idealCustomerProfile", "painPoints", "competitors"],
  outputArtifactKind: "research-brief",
  allowedConfigFields: ["focusAreas", "competitorSet", "trendWindowDays"]
};
