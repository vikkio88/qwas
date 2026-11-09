import { describe, expect, test } from "bun:test";
import { SEED_COMMANDS } from "./seed.js";

describe("SEED_COMMANDS", () => {
  test("is not empty", () => {
    expect(SEED_COMMANDS.length).toBeGreaterThan(0);
  });

  test("every entry has a non-empty command, description and at least one tag", () => {
    for (const c of SEED_COMMANDS) {
      expect(c.command.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(Array.isArray(c.tags)).toBe(true);
      expect(c.tags.length).toBeGreaterThan(0);
    }
  });

  test("includes examples for disk size, free space, ffmpeg and imagemagick", () => {
    const allTags = SEED_COMMANDS.flatMap((c) => c.tags);
    expect(allTags).toContain("size");
    expect(allTags).toContain("free");
    expect(allTags).toContain("ffmpeg");
    expect(allTags).toContain("imagemagick");
  });
});
