import { describe, expect, it } from "vitest";
import {
  clampTime,
  createEmptyProject,
  formatTime,
  getAspectRatioValue,
  normalizeProject,
} from "./project";

describe("project model", () => {
  it("creates a complete local-first project", () => {
    const project = createEmptyProject("Demo");
    expect(project.name).toBe("Demo");
    expect(project.version).toBe(1);
    expect(project.appearance.aspectRatio).toBe("source");
    expect(project.export.frameRate).toBe(60);
    expect(project.assets).toEqual([]);
  });

  it("normalizes partial persisted projects", () => {
    const project = normalizeProject({
      id: "saved",
      name: "Recovered",
      appearance: { padding: 12 },
    });
    expect(project.id).toBe("saved");
    expect(project.appearance.padding).toBe(12);
    expect(project.appearance.radius).toBeGreaterThan(0);
    expect(project.webcam.enabled).toBe(false);
  });

  it("resolves ratios and clamps invalid time", () => {
    expect(getAspectRatioValue("source", 2.1)).toBe(2.1);
    expect(getAspectRatioValue("9:16", 2.1)).toBeCloseTo(9 / 16);
    expect(clampTime(Number.NaN, 10)).toBe(0);
    expect(clampTime(12, 10)).toBe(10);
    expect(formatTime(65.42)).toBe("01:05.42");
  });
});
