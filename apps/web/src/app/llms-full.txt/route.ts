import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { TEXT_HEADERS } from "@/lib/site";

export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(source.getPages().map(getLLMText));
  return new Response(pages.join("\n\n---\n\n"), { headers: TEXT_HEADERS });
}
