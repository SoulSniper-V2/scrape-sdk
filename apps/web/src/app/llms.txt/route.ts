import { docsIndexLines } from "@/lib/get-llm-text";
import { PRODUCT_PREAMBLE } from "@/lib/llms-index";
import { TEXT_HEADERS } from "@/lib/site";

export const revalidate = false;

export function GET() {
  return new Response(`${PRODUCT_PREAMBLE}${docsIndexLines()}\n`, {
    headers: TEXT_HEADERS,
  });
}
