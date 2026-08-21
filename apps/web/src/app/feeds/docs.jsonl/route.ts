import { source } from "@/lib/source";
import { SITE_URL, markdownUrl } from "@/lib/site";

export const revalidate = false;

export function GET() {
  const lines = source.getPages().map((page) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": `${SITE_URL}${page.url}`,
      url: `${SITE_URL}${page.url}`,
      name: page.data.title,
      description: page.data.description || "",
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      encoding: {
        "@type": "MediaObject",
        encodingFormat: "text/markdown",
        contentUrl: `${SITE_URL}${markdownUrl(page.url)}`,
      },
    })
  );

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
