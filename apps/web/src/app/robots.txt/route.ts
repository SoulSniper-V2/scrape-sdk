import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export function GET() {
  const body = `User-agent: *
Allow: /

# Machine-readable docs for agents (do not scrape HTML)
# ${SITE_URL}/llms.txt
# ${SITE_URL}/docs/llms.txt
# ${SITE_URL}/llms-full.txt
# ${SITE_URL}/feeds/docs.jsonl

Schemamap: ${SITE_URL}/schemamap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
