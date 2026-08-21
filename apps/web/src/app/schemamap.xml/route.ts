import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Schema Map for Scrape SDK (NLWeb Schema Feeds).
  Referenced from robots.txt via the Schemamap: directive. Spec: https://nlweb.ai
-->
<schemamap>
  <feed>
    <loc>${SITE_URL}/feeds/docs.jsonl</loc>
    <format>application/x-ndjson</format>
    <vocabulary>https://schema.org</vocabulary>
    <description>Scrape SDK documentation as schema.org TechArticle entities, one JSON object per line.</description>
  </feed>
  <feed>
    <loc>${SITE_URL}/llms.txt</loc>
    <format>text/plain</format>
    <description>Site-level LLM index for Scrape SDK.</description>
  </feed>
  <feed>
    <loc>${SITE_URL}/llms-full.txt</loc>
    <format>text/plain</format>
    <description>Combined current Scrape SDK documentation as Markdown.</description>
  </feed>
</schemamap>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
