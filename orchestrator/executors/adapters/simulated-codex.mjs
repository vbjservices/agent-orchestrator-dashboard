export const simulatedCodexAdapter = {
  id: "simulated-codex",
  async execute({ handler, context }) {
    return handler(context);
  }
};
