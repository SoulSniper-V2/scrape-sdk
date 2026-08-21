import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { source } from "@/lib/source";
import { SITE_URL, markdownUrl } from "@/lib/site";

export type DocPage = ReturnType<typeof source.getPages>[number];

export async function getLLMText(page: DocPage): Promise<string> {
  const body = await readPageMarkdown(page);
  const canonical = `${SITE_URL}${page.url}`;
  return `# ${page.data.title} (${canonical})

Canonical: ${canonical}
Markdown: ${SITE_URL}${markdownUrl(page.url)}

${body}`.trim();
}

async function readPageMarkdown(page: DocPage): Promise<string> {
  const data = page.data as { getText?: (kind: "processed" | "raw") => Promise<string> };
  if (typeof data.getText === "function") {
    try {
      return await data.getText("processed");
    } catch {
      // Fall through to the source file.
    }
  }

  const relative =
    "path" in page && typeof page.path === "string"
      ? page.path
      : `${(page.slugs ?? []).join("/") || "index"}.mdx`;
  const filePath = join(process.cwd(), "content/docs", relative);
  const raw = await readFile(filePath, "utf8");
  return raw.replace(/^---[\r\n]+[\s\S]*?---[\r\n]*/, "").trim();
}

export function docsIndexLines(): string {
  return source
    .getPages()
    .map((page) => {
      const desc = page.data.description ? `: ${page.data.description}` : "";
      return `- [${page.data.title}](${page.url})${desc}`;
    })
    .join("\n");
}
