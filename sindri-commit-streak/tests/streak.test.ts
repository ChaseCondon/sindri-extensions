import { describe, expect, it } from "bun:test";
import { computeStreak } from "../src/streak";

const TODAY = new Date("2024-06-15T12:00:00Z");

describe("computeStreak", () => {
  it("returns 0 for no commits", () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  it("returns 0 when today has no commit", () => {
    expect(computeStreak(["2024-06-14", "2024-06-13"], TODAY)).toBe(0);
  });

  it("returns 1 for a single commit today", () => {
    expect(computeStreak(["2024-06-15"], TODAY)).toBe(1);
  });

  it("counts consecutive days back from today", () => {
    expect(
      computeStreak(["2024-06-15", "2024-06-14", "2024-06-13"], TODAY),
    ).toBe(3);
  });

  it("stops at a gap", () => {
    // Jun 13 is missing — streak breaks after Jun 15 and Jun 14
    expect(
      computeStreak(["2024-06-15", "2024-06-14", "2024-06-12"], TODAY),
    ).toBe(2);
  });

  it("ignores future dates", () => {
    expect(
      computeStreak(["2024-06-16", "2024-06-15", "2024-06-14"], TODAY),
    ).toBe(2);
  });

  it("handles duplicate dates", () => {
    const dates = ["2024-06-15", "2024-06-15", "2024-06-14"];
    expect(computeStreak(dates, TODAY)).toBe(2);
  });
});
