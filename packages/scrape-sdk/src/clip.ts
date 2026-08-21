export const AGENT_MAX_CHARS = 20_000;

export function clipText(text: string, maxChars?: number): { text: string; truncated: boolean } {
  if (!maxChars || maxChars <= 0 || text.length <= maxChars) {
    return { text, truncated: false };
  }
  return {
    text: `${text.slice(0, maxChars).trimEnd()}\n\n[truncated]`,
    truncated: true,
  };
}
