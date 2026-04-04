export function draftDmReply({ artifacts }) {
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
