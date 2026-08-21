export function firstHeading(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m) || markdown.match(/^Title:\s*(.+)$/m);
  return match ? match[1].trim() : "";
}
