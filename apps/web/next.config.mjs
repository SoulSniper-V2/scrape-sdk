import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["scrape-sdk"],
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms.mdx/docs" },
      { source: "/docs/:path*.md", destination: "/llms.mdx/docs/:path*" },
    ];
  },
};

export default withMDX(config);
