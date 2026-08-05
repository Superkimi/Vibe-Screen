import { describe, expect, it } from "vitest";
import {
  getEditedDuration,
  clampTime,
  createEmptyProject,
  formatTime,
  getAspectRatioValue,
  normalizeProject,
  sourceTimeToTimelineTime,
  timelineTimeToSourceTime,
} from "./project";

describe("project model", () => {
  it("creates a complete local-first project", () => {
    const project = createEmptyProject("Demo");
    expect(project.name).toBe("Demo");
    expect(project.version).toBe(2);
    expect(project.appearance.aspectRatio).toBe("source");
    expect(project.export.frameRate).toBe(60);
    expect(project.assets).toEqual([]);
  });

  it("maps local speed regions into a shorter edited duration", () => {
    const project = createEmptyProject();
    project.trim = { start: 0, end: 10 };
    project.speedRegions = [{ id: "speed", start: 2, end: 6, speed: 2 }];
    expect(getEditedDuration(project, 10)).toBe(8);
    expect(sourceTimeToTimelineTime(project, 6, 10)).toBe(4);
    expect(timelineTimeToSourceTime(project, 4, 10)).toBe(6);
  });

  it("recovers speed regions from older partial project data", () => {
    const project = normalizeProject({
      version: 1,
      speedRegions: [{ id: "saved", start: 1, end: 4, speed: 1.25 }],
    });
    expect(project.version).toBe(2);
    expect(project.speedRegions[0]).toMatchObject({ id: "saved", speed: 1.25 });
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
