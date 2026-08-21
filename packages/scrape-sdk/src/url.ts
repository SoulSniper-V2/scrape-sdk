import { InvalidUrlError } from "./errors.js";

export function assertHttpUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new InvalidUrlError(value);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidUrlError(value);
  }
  return parsed;
}

export function originOf(url: string): string {
  return assertHttpUrl(url).origin;
}
