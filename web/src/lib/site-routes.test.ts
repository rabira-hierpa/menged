import { afterEach, describe, expect, it, vi } from "vitest";

describe("SEO route handlers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("sitemap lists public surfaces and uses the canonical origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dandii.et/");
    const { default: sitemap } = await import("../app/sitemap");
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual([
      "https://dandii.et",
      "https://dandii.et/sign-in",
    ]);
  });

  it("robots disallows private areas and allows AI crawlers", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dandii.et");
    const { default: robots } = await import("../app/robots");
    const config = robots();
    expect(config.sitemap).toBe("https://dandii.et/sitemap.xml");
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallow = rules.flatMap((r) => {
      const d = r.disallow;
      return d == null ? [] : Array.isArray(d) ? d : [d];
    });
    expect(disallow).toEqual(
      expect.arrayContaining([
        "/console",
        "/settings",
        "/profile",
        "/api/",
      ]),
    );
    const userAgents = rules.map((r) => r.userAgent).flat();
    expect(userAgents).toEqual(
      expect.arrayContaining(["GPTBot", "ClaudeBot", "Google-Extended"]),
    );
  });
});
