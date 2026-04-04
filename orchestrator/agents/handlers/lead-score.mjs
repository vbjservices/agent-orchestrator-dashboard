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

export function scoreLead({ workflowInstance }) {
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
