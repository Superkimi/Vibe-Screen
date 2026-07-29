import { describe, expect, it } from "vitest";
import { LANDING_LOCALES, isLandingLocale, landingCopy } from "./landing-copy";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("landing page localization", () => {
  it("supports only the two first-class locales", () => {
    expect(LANDING_LOCALES).toEqual(["zh", "en"]);
    expect(isLandingLocale("zh")).toBe(true);
    expect(isLandingLocale("en")).toBe(true);
    expect(isLandingLocale("fr")).toBe(false);
  });

  it("keeps Chinese and English copy paths identical", () => {
    expect(keyPaths(landingCopy.zh)).toEqual(keyPaths(landingCopy.en));
  });

  it("contains complete copy without forbidden dash characters", () => {
    for (const locale of LANDING_LOCALES) {
      const values = JSON.stringify(landingCopy[locale]);
      expect(values).not.toMatch(/[—–]/);
      expect(values).not.toContain('""');
    }
  });
});
