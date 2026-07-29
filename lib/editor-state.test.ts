import { describe, expect, it } from "vitest";
import { createEditorState, editorReducer } from "./editor-state";
import { type MediaAsset } from "./project";

const asset: MediaAsset = {
  id: "screen-1",
  kind: "screen",
  name: "Capture.webm",
  mimeType: "video/webm",
  size: 1024,
  duration: 12,
  width: 1920,
  height: 1080,
  createdAt: "2026-07-29T00:00:00.000Z",
};

describe("editor reducer", () => {
  it("adds a primary clip and initializes its trim", () => {
    const state = editorReducer(createEditorState(), {
      type: "ADD_ASSET",
      asset,
      makePrimary: true,
    });
    expect(state.project.screenAssetId).toBe(asset.id);
    expect(state.project.trim).toEqual({ start: 0, end: 12 });
    expect(state.past).toHaveLength(1);
  });

  it("adds timeline regions at the playhead and supports undo", () => {
    let state = editorReducer(createEditorState(), {
      type: "ADD_ASSET",
      asset,
      makePrimary: true,
    });
    state = editorReducer(state, { type: "SEEK", time: 4 });
    state = editorReducer(state, { type: "ADD_ZOOM" });
    expect(state.project.zoomRegions[0]).toMatchObject({ start: 4, end: 6, scale: 1.5 });
    const undone = editorReducer(state, { type: "UNDO" });
    expect(undone.project.zoomRegions).toHaveLength(0);
    expect(undone.future).toHaveLength(1);
  });

  it("keeps camera media as an independently editable asset", () => {
    const camera = { ...asset, id: "camera-1", kind: "camera" as const };
    let state = editorReducer(createEditorState(), { type: "ADD_ASSET", asset });
    state = editorReducer(state, { type: "ADD_ASSET", asset: camera });
    expect(state.project.webcam).toMatchObject({
      enabled: true,
      assetId: "camera-1",
    });
    expect(state.project.screenAssetId).toBe("screen-1");
  });
});
