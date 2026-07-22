import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecentSearches,
  readRecentSearches,
  recordSearch,
} from "./recent-searches";

const KEY = "dandii.recentSearches";

describe("recent-searches", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    // Force a fresh window for the typeof window checks.
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores queries shorter than 2 characters", () => {
    recordSearch("a");
    recordSearch("  ");
    expect(readRecentSearches()).toEqual([]);
  });

  it("trims, dedupes case-insensitively, and caps at 20", () => {
    recordSearch("  AB001  ");
    recordSearch("ab001");
    expect(readRecentSearches()).toHaveLength(1);
    // Latest casing wins after case-insensitive dedupe.
    expect(readRecentSearches()[0]?.q).toBe("ab001");

    for (let i = 0; i < 25; i++) {
      recordSearch(`q${i}`);
    }
    expect(readRecentSearches()).toHaveLength(20);
    expect(readRecentSearches()[0]?.q).toBe("q24");
  });

  it("clearRecentSearches removes the key", () => {
    recordSearch("AB001");
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("returns empty on malformed JSON", () => {
    localStorage.setItem(KEY, "{not-json");
    expect(readRecentSearches()).toEqual([]);
  });
});
