import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(path.resolve(__dirname, relative), "utf8");

describe("public marketing metrics stay factual", () => {
  it("does not hardcode fictional mission enrollment counts", () => {
    const source = read("../components/ChallengesSection.tsx");
    expect(source).not.toMatch(/\b(12453|8921|3247|15678|9832|2156)\b/);
    expect(source).not.toMatch(/hundreds of missions/i);
  });

  it("does not advertise fictional global prizes or leaderboard personas", () => {
    const source = read("../components/LeaderboardSection.tsx");
    expect(source).not.toMatch(/Sarah Chen|Marcus Johnson|Elena Rodriguez|James Wilson|Aisha Patel/);
    expect(source).not.toMatch(/\$50K|150\+|Monthly Prizes|Countries Represented/);
  });
});
