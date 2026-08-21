import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const revalidate = false;

export async function GET() {
  const content = await readFile(join(process.cwd(), "public/skills/scrape-sdk/SKILL.md"), "utf8");
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
