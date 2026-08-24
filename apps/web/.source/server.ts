// @ts-nocheck
import * as __fd_glob_25 from "../content/docs/providers/tavily.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/providers/spider.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/providers/local.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/providers/jina.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/providers/index.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/providers/firecrawl.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/providers/browserbase.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/guides/vercel-ai-sdk.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/guides/offline-testing.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/guides/model-context-protocol.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/concepts/markdown-pipeline.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/concepts/failover-matrix.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/concepts/error-handling.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/api-reference/create-scrape-client.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/agents/machine-readable-docs.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/agents/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/quickstart.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/how-it-works.mdx?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/providers/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/guides/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/api-reference/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/concepts/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/agents/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "agents/meta.json": __fd_glob_1, "concepts/meta.json": __fd_glob_2, "api-reference/meta.json": __fd_glob_3, "guides/meta.json": __fd_glob_4, "providers/meta.json": __fd_glob_5, }, {"how-it-works.mdx": __fd_glob_6, "index.mdx": __fd_glob_7, "installation.mdx": __fd_glob_8, "quickstart.mdx": __fd_glob_9, "agents/index.mdx": __fd_glob_10, "agents/machine-readable-docs.mdx": __fd_glob_11, "api-reference/create-scrape-client.mdx": __fd_glob_12, "concepts/error-handling.mdx": __fd_glob_13, "concepts/failover-matrix.mdx": __fd_glob_14, "concepts/markdown-pipeline.mdx": __fd_glob_15, "guides/model-context-protocol.mdx": __fd_glob_16, "guides/offline-testing.mdx": __fd_glob_17, "guides/vercel-ai-sdk.mdx": __fd_glob_18, "providers/browserbase.mdx": __fd_glob_19, "providers/firecrawl.mdx": __fd_glob_20, "providers/index.mdx": __fd_glob_21, "providers/jina.mdx": __fd_glob_22, "providers/local.mdx": __fd_glob_23, "providers/spider.mdx": __fd_glob_24, "providers/tavily.mdx": __fd_glob_25, });