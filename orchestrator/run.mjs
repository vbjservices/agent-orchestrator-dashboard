import { runOrchestrator } from "./lib/runner.mjs";

function parseArgs(argv) {
  return argv.reduce((accumulator, argument) => {
    if (argument.startsWith("--workspace=")) {
      accumulator.workspaceId = argument.slice("--workspace=".length);
    } else if (argument.startsWith("--workflow=")) {
      accumulator.workflowId = argument.slice("--workflow=".length);
    } else if (argument.startsWith("--trigger=")) {
      accumulator.trigger = argument.slice("--trigger=".length);
    }

    return accumulator;
  }, {});
}

const options = parseArgs(process.argv.slice(2));

runOrchestrator(options)
  .then(({ runs }) => {
    const executed = runs.length;
    process.stdout.write(`Executed ${executed} workflow run${executed === 1 ? "" : "s"}.\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
