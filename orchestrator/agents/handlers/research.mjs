export function summarizeResearch({ workspace, workflowInstance }) {
  const competitors = workspace.competitors.slice(0, 2).join(" and ");
  const painPoint = workspace.painPoints[0];

  const findings = [
    `${workspace.idealCustomerProfile} care about predictable pipeline, not another shiny tool stack.`,
    `The strongest hook for ${workflowInstance.params.campaignTheme} is operational relief, because ${painPoint.toLowerCase()}.`,
    `Competitor pressure is coming from ${competitors}, but most of them still sell isolated tools instead of orchestrated systems.`
  ];

  return {
    summary: `Captured ${findings.length} positioning signals for ${workspace.name}.`,
    artifact: {
      kind: "research-brief",
      headline: `${workspace.name} research brief`,
      bullets: findings
    },
    logs: [
      `Scanned ICP: ${workspace.idealCustomerProfile}.`,
      `Evaluated campaign theme: ${workflowInstance.params.campaignTheme}.`,
      `Flagged primary pain: ${painPoint}.`
    ],
    costUsd: 0.18
  };
}
