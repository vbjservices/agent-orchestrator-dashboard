export function draftScript({ workspace, workflowInstance, artifacts }) {
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
