import * as cheerio from "cheerio";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  hr: "---",
});

turndown.remove(["script", "style", "noscript", "iframe", "form"]);

turndown.addRule("preCode", {
  filter: (node) => node.nodeName === "PRE",
  replacement: (_content, node) => {
    const el = node as unknown as { textContent?: string; querySelector?: (s: string) => { className?: string } | null };
    const code = el.querySelector?.("code");
    const lang = String(code?.className ?? "").replace(/^language-/, "").split(" ")[0] || "";
    const text = (el.textContent ?? "").replace(/\n$/, "");
    return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
  },
});

const BOILERPLATE = "script, style, noscript, iframe, svg, canvas, form, nav, footer, header, aside, [role='navigation'], [role='banner'], [role='contentinfo'], .cookie, .cookie-banner, #cookie-banner, .ads, .advertisement, .sidebar, .share, .social, .comments, #comments";

export interface HtmlDocument {
  title: string;
  description: string;
  ogImage: string;
  language: string;
  canonicalUrl?: string;
  html: string;
  mainHtml: string;
  text: string;
  links: string[];
  images: string[];
}

export function parseHtml(html: string, pageUrl: string, onlyMainContent = true): HtmlDocument {
  const $ = cheerio.load(html);
  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "";
  const description =
    $("meta[name='description']").attr("content")?.trim() ||
    $("meta[property='og:description']").attr("content")?.trim() ||
    "";
  const ogImage = $("meta[property='og:image']").attr("content")?.trim() || "";
  const language = $("html").attr("lang")?.trim() || "";
  const canonicalUrl = $("link[rel='canonical']").attr("href")?.trim();

  $(BOILERPLATE).remove();

  const mainHtml = onlyMainContent ? pickMainHtml($) : $("body").html() || $.html();
  const text = markdownToText(htmlToMarkdown(mainHtml));

  const links: string[] = [];
  const images: string[] = [];
  const seenLinks = new Set<string>();
  const seenImages = new Set<string>();

  $("a[href]").each((_, el) => {
    const abs = absolutize(pageUrl, $(el).attr("href"));
    if (abs && !seenLinks.has(abs)) {
      seenLinks.add(abs);
      links.push(abs);
    }
  });
  $("img[src]").each((_, el) => {
    const abs = absolutize(pageUrl, $(el).attr("src"));
    if (abs && !seenImages.has(abs)) {
      seenImages.add(abs);
      images.push(abs);
    }
  });

  return {
    title,
    description,
    ogImage,
    language,
    canonicalUrl: canonicalUrl ? absolutize(pageUrl, canonicalUrl) : undefined,
    html,
    mainHtml,
    text,
    links,
    images,
  };
}

export function htmlToMarkdown(html: string): string {
  const markdown = turndown.turndown(html || "");
  return markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function markdownToText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function pickMainHtml($: cheerio.CheerioAPI): string {
  const candidates = [
    "article",
    "main",
    "[role='main']",
    "#content",
    "#main",
    ".post-content",
    ".entry-content",
    ".article-content",
    ".markdown-body",
    ".prose",
  ];
  for (const selector of candidates) {
    const node = $(selector).first();
    if (node.length && textLen(node) > 80) {
      return node.html() || "";
    }
  }

  let best: { html: string; score: number } | undefined;
  $("div, section").each((_, el) => {
    const node = $(el);
    const score = textLen(node) - node.find("a").length * 20;
    if (!best || score > best.score) {
      best = { html: node.html() || "", score };
    }
  });
  if (best && best.score > 120) return best.html;
  return $("body").html() || $.html();
}

function textLen(node: { text: () => string }): number {
  return node.text().replace(/\s+/g, " ").trim().length;
}

function absolutize(base: string, href?: string): string | undefined {
  if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("#")) {
    return undefined;
  }
  try {
    return new URL(href, base).href;
  } catch {
    return undefined;
  }
}
