import { getAgentTemplate } from "./catalog.mjs";

function titleCase(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function revenueScore(monthlyRevenueBand) {
  switch (monthlyRevenueBand) {
    case "100k+":
      return 24;
    case "50k-100k":
      return 18;
    case "10k-50k":
      return 12;
    default:
      return 6;
  }
}

function painScore(painLevel) {
  switch (painLevel) {
    case "high":
      return 28;
    case "medium":
      return 16;
    default:
      return 8;
  }
}

function summarizeResearch({ workspace, workflowInstance }) {
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

function generateAngles({ workspace, workflowInstance, artifacts }) {
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

function draftScript({ workspace, workflowInstance, artifacts }) {
  const bestIdea = artifacts["generate-angles"]?.ideas?.[0];
  const callToAction = workflowInstance.params.callToAction;

  const script = [
    "Stop calling your problem a lead-gen issue.",
    "If you are still routing inbound demand by hand, your pipeline is leaking before sales even starts.",
    `${workspace.name} uses orchestrated agents to research, qualify, and follow up without founder babysitting.`,
    "The point is not more AI noise. The point is a system that actually ships.",
    `${callToAction}.`
  ].join(" ");

  return {
    summary: `Drafted a short-form script around the angle "${bestIdea?.title ?? "core message"}".`,
    artifact: {
      kind: "script",
      headline: `${workflowInstance.name} script draft`,
      selectedAngle: bestIdea ?? null,
      script
    },
    logs: [
      `Selected angle: ${bestIdea?.title ?? "fallback angle"}.`,
      `Generated script CTA: ${callToAction}.`
    ],
    costUsd: 0.21
  };
}

function scoreLead({ workflowInstance }) {
  const lead = workflowInstance.params.sampleLead;
  const threshold = workflowInstance.params.qualificationThreshold;
  const score =
    20 +
    Math.min(lead.teamSize * 3, 24) +
    revenueScore(lead.monthlyRevenueBand) +
    painScore(lead.painLevel);

  const disposition = score >= threshold ? "qualified" : "nurture";

  return {
    summary: `Lead scored ${score}/${threshold} and was classified as ${disposition}.`,
    artifact: {
      kind: "lead-score",
      headline: `${lead.company} qualification`,
      lead,
      threshold,
      score,
      disposition
    },
    logs: [
      `Lead source: ${lead.source}.`,
      `Team size score applied for ${lead.teamSize} seats.`,
      `Revenue band ${lead.monthlyRevenueBand} and pain ${lead.painLevel} mapped into qualification score.`
    ],
    costUsd: 0.09
  };
}

function draftDmReply({ artifacts }) {
  const leadScore = artifacts["score-lead"];
  const lead = leadScore?.lead;
  const disposition = leadScore?.disposition ?? "nurture";

  const response =
    disposition === "qualified"
      ? `Thanks for reaching out, ${lead.company}. You look like a fit. Next step is a short diagnostic call so we can map your current workflow leaks and automation opportunities.`
      : `Thanks for reaching out, ${lead.company}. You are early for a systems engagement, so the right next step is a lighter audit and a follow-up when the demand volume is higher.`;

  return {
    summary: `Drafted a ${disposition} DM response for ${lead?.company ?? "the lead"}.`,
    artifact: {
      kind: "dm-draft",
      headline: `DM reply for ${lead?.company ?? "lead"}`,
      response,
      disposition
    },
    logs: [
      `Disposition carried forward: ${disposition}.`,
      `Drafted follow-up response for ${lead?.company ?? "lead"}.`
    ],
    costUsd: 0.05
  };
}

const stepHandlers = {
  research: summarizeResearch,
  angles: generateAngles,
  script: draftScript,
  "lead-score": scoreLead,
  "dm-reply": draftDmReply
};

export async function executeStep(step, context) {
  const handler = stepHandlers[step.handlerKey];

  if (!handler) {
    throw new Error(`No handler registered for ${step.handlerKey}.`);
  }

  const agent = getAgentTemplate(step.agentId);
  const result = handler(context);

  return {
    ...result,
    agentName: agent?.name ?? step.agentId
  };
}
