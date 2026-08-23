import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, "..", relativePath), "utf8"));
}

const sdk = readJson("packages/scrape-sdk/package.json");
const mcp = readJson("packages/mcp-server/package.json");
const sourceVersion = sdk.version;
const errors = [];

if (mcp.version !== sourceVersion) {
  errors.push(`packages/mcp-server/package.json is ${mcp.version}; expected ${sourceVersion}`);
}
if (mcp.dependencies?.["scrape-sdk"] !== `^${sourceVersion}`) {
  errors.push(`MCP scrape-sdk dependency must be ^${sourceVersion}`);
}

for (const relativePath of [
  "skills/scrape-sdk/SKILL.md",
  "apps/web/public/skill.md",
  "apps/web/public/skills/scrape-sdk/SKILL.md",
]) {
  const content = fs.readFileSync(path.join(root, "..", relativePath), "utf8");
  const match = content.match(/version:\s*["']([^"']+)["']/);
  if (!match) errors.push(`${relativePath} has no version metadata`);
  else if (match[1] !== sourceVersion) errors.push(`${relativePath} is ${match[1]}; expected ${sourceVersion}`);
}

const serverSource = fs.readFileSync(path.join(root, "..", "packages/mcp-server/src/index.ts"), "utf8");
if (!serverSource.includes("packageJson.version")) {
  errors.push("MCP server runtime version must come from packages/mcp-server/package.json");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Versions synchronized at ${sourceVersion}`);
