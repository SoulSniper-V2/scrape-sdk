import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/docs") || path.endsWith(".md") || path.endsWith(".txt")) {
    return NextResponse.next();
  }
  if (accept.includes("text/markdown") && !accept.includes("text/html")) {
    const dest = path === "/docs" ? "/docs.md" : `${path}.md`;
    return NextResponse.rewrite(new URL(dest, request.nextUrl), {
      headers: { Vary: "Accept" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/docs", "/docs/:path*"],
};
