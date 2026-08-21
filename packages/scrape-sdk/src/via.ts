import { FailoverHop } from "./types.js";

export function viaLine(result: {
  provider: string;
  latencyMs: number;
  failedOverFrom?: FailoverHop[];
}): string {
  const hops = result.failedOverFrom ?? [];
  const suffix = hops.length
    ? ` (${hops.map((h) => `${h.provider} ${h.reason}`).join(" → ")})`
    : "";
  return `via ${result.provider} in ${result.latencyMs}ms${suffix}`;
}
