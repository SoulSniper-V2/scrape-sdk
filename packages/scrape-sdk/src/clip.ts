export const AGENT_MAX_CHARS = 20_000;

export function clipText(text: string, maxChars?: number): { text: string; truncated: boolean } {
  if (maxChars === undefined) {
    return { text, truncated: false };
  }
  if (!Number.isInteger(maxChars) || maxChars < 0) {
    throw new RangeError("maxChars must be an integer >= 0");
  }
  if (text.length <= maxChars) return { text, truncated: false };
  const marker = "\n\n[truncated]";
  if (maxChars <= marker.length) {
    return { text: text.slice(0, maxChars), truncated: true };
  }
  return {
    text: `${text.slice(0, maxChars - marker.length).trimEnd()}${marker}`,
    truncated: true,
  };
}
