import { describe, expect, it } from "vitest";
import { createEmptyProject } from "./project";
import { activeZoomAt, calculateOutputSize, interpolatedZoomAt } from "./render-frame";

describe("render geometry", () => {
  it("calculates even high-quality output sizes", () => {
    const project = createEmptyProject();
    project.appearance.aspectRatio = "9:16";
    project.export.quality = "1080p";
    expect(calculateOutputSize(project, { width: 1920, height: 1080 })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("keeps source dimensions when requested", () => {
    const project = createEmptyProject();
    project.export.quality = "source";
    expect(calculateOutputSize(project, { width: 1919, height: 1079 })).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("selects the top-most active zoom", () => {
    const project = createEmptyProject();
    project.zoomRegions = [
      { id: "first", start: 1, end: 4, scale: 1.2, x: 50, y: 50 },
      { id: "second", start: 2, end: 3, scale: 1.8, x: 30, y: 40 },
    ];
    expect(activeZoomAt(project, 2.5)?.id).toBe("second");
    expect(activeZoomAt(project, 5)).toBeNull();
  });

  it("smooths zoom entry and exit instead of jumping at region boundaries", () => {
    const project = createEmptyProject();
    project.zoomRegions = [{ id: "focus", start: 1, end: 3, scale: 2, x: 20, y: 30 }];
    expect(interpolatedZoomAt(project, 1)?.scale).toBeCloseTo(1);
    expect(interpolatedZoomAt(project, 2)?.scale).toBeCloseTo(2);
    expect(interpolatedZoomAt(project, 3)?.scale).toBeCloseTo(1);
  });
});
