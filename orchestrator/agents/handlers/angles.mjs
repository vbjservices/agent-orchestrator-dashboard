function titleCase(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function generateAngles({ workspace, workflowInstance, artifacts }) {
  const researchBullets = artifacts["research-signals"]?.bullets ?? [];
  const callToAction = workflowInstance.params.callToAction;

  const ideas = [
    {
      title: "The hidden ops tax",
      angle: `${workspace.idealCustomerProfile} lose margin every week because their follow-up path is manual.`,
      hook: "You do not need more leads. You need fewer leaks.",
      cta: callToAction
    },
    {
      title: "Why content fails after 2 weeks",
      angle: "Most teams have ideas, but no orchestration layer to turn them into repeatable output.",
      hook: "Consistency is not a discipline problem. It is a systems problem.",
      cta: callToAction
    },
    {
      title: "Tool stack theater",
      angle: `${workspace.vertical} buyers are tired of vendors selling fragments instead of working systems.`,
      hook: "If your stack needs a human babysitter, it is not automation.",
      cta: callToAction
    }
  ];

  return {
    summary: `Generated ${ideas.length} usable content angles from the research brief.`,
    artifact: {
      kind: "idea-pack",
      headline: `${titleCase(workflowInstance.name)} angles`,
      sourceSignals: researchBullets,
      ideas
    },
    logs: [
      "Promoted research signal into 3 angles.",
      `Attached CTA: ${callToAction}.`
    ],
    costUsd: 0.12
  };
}
