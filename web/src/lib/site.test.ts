import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "./site";

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SITE_URL over BETTER_AUTH_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://public.example/");
    vi.stubEnv("BETTER_AUTH_URL", "https://auth.example");
    expect(siteUrl()).toBe("https://public.example");
  });

  it("falls back to BETTER_AUTH_URL when public URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("BETTER_AUTH_URL", "https://auth.example/");
    expect(siteUrl()).toBe("https://auth.example");
  });

  it("defaults to https://dandii.et when neither env is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("BETTER_AUTH_URL", "");
    expect(siteUrl()).toBe("https://dandii.et");
  });
});
