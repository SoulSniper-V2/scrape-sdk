import { docsOnlyIndex } from "@/lib/llms-index";
import { TEXT_HEADERS } from "@/lib/site";

export const revalidate = false;

export function GET() {
  return new Response(docsOnlyIndex(), { headers: TEXT_HEADERS });
}
