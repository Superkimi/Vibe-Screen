import { describe, expect, it } from "vitest";
import { editorCopy } from "./editor-copy";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
}

describe("editor localization", () => {
  it("keeps Chinese and English resource shapes in parity", () => {
    expect(leafKeys(editorCopy.zh)).toEqual(leafKeys(editorCopy.en));
  });

  it("translates the surfaces that are visible when the editor opens", () => {
    expect(editorCopy.zh.media.noMedia).toBe("还没有媒体");
    expect(editorCopy.en.media.noMedia).toBe("No media yet");
    expect(editorCopy.zh.recorder.setupTitle).toBe("开始新的录制");
    expect(editorCopy.en.recorder.setupTitle).toBe("Start a new recording");
    expect(editorCopy.zh.inspector.panel.canvas).toBe("画布");
    expect(editorCopy.en.inspector.panel.canvas).toBe("Canvas");
  });
});
