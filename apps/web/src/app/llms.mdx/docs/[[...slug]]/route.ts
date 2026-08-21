import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { MARKDOWN_HEADERS } from "@/lib/site";
import { notFound } from "next/navigation";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), { headers: MARKDOWN_HEADERS });
}

export function generateStaticParams() {
  return source.generateParams();
}
