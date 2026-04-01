export const agentTemplates = [
  {
    id: "content-researcher",
    name: "Content Researcher",
    category: "research",
    responsibility: "Find positioning signals, objections, and trend hooks."
  },
  {
    id: "idea-generator",
    name: "Idea Generator",
    category: "creative",
    responsibility: "Turn research into concrete angles and hooks."
  },
  {
    id: "script-writer",
    name: "Script Writer",
    category: "creative",
    responsibility: "Convert a winning angle into a usable output."
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    category: "sales",
    responsibility: "Score inbound demand before sales time is spent."
  },
  {
    id: "dm-automation",
    name: "DM Automation",
    category: "sales",
    responsibility: "Draft a follow-up response tied to lead quality."
  }
];

export const workflowTemplates = {
  "content-pipeline": {
    id: "content-pipeline",
    name: "Content Pipeline",
    description: "Research, ideation, and scripting for a tenant-specific campaign theme.",
    supportedTriggerModes: ["manual_or_schedule"],
    steps: [
      {
        id: "research-signals",
        name: "Research Signals",
        agentId: "content-researcher",
        executor: "simulated-codex",
        handlerKey: "research"
      },
      {
        id: "generate-angles",
        name: "Generate Angles",
        agentId: "idea-generator",
        executor: "simulated-codex",
        handlerKey: "angles"
      },
      {
        id: "draft-script",
        name: "Draft Script",
        agentId: "script-writer",
        executor: "simulated-codex",
        handlerKey: "script"
      }
    ]
  },
  "lead-qualification": {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Score an inbound lead and draft the right follow-up path.",
    supportedTriggerModes: ["manual_or_webhook"],
    steps: [
      {
        id: "score-lead",
        name: "Score Lead",
        agentId: "lead-qualifier",
        executor: "simulated-codex",
        handlerKey: "lead-score"
      },
      {
        id: "draft-response",
        name: "Draft Response",
        agentId: "dm-automation",
        executor: "simulated-codex",
        handlerKey: "dm-reply"
      }
    ]
  }
};

export function getAgentTemplate(agentId) {
  return agentTemplates.find((agent) => agent.id === agentId) ?? null;
}

export function getWorkflowTemplate(templateId) {
  return workflowTemplates[templateId] ?? null;
}
