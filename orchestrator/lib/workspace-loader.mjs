import { promises as fs } from "node:fs";
import path from "node:path";

export async function loadWorkspaces(workspaceConfigDir) {
  const entries = await fs.readdir(workspaceConfigDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

  const workspaces = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(workspaceConfigDir, file.name);
      const raw = await fs.readFile(fullPath, "utf8");
      return JSON.parse(raw);
    })
  );

  return workspaces.sort((left, right) => left.name.localeCompare(right.name));
}
