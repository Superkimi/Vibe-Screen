export interface BrowserCapabilities {
  secureContext: boolean;
  displayCapture: boolean;
  mediaRecorder: boolean;
  webCodecs: boolean;
  fileSystemAccess: boolean;
  indexedDb: boolean;
  canvasCapture: boolean;
  recommended: boolean;
}

export function detectCapabilities(scope: Window = window): BrowserCapabilities {
  const mediaDevices = scope.navigator.mediaDevices;
  const canvas = scope.document.createElement("canvas");
  const capabilities = {
    secureContext: scope.isSecureContext,
    displayCapture: Boolean(mediaDevices?.getDisplayMedia),
    mediaRecorder: "MediaRecorder" in scope,
    webCodecs: "VideoEncoder" in scope && "VideoDecoder" in scope,
    fileSystemAccess: "showSaveFilePicker" in scope,
    indexedDb: "indexedDB" in scope,
    canvasCapture: "captureStream" in canvas,
    recommended: false,
  };
  capabilities.recommended =
    capabilities.secureContext &&
    capabilities.displayCapture &&
    capabilities.mediaRecorder &&
    capabilities.canvasCapture;
  return capabilities;
}

export function selectRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function qualityBitrate(width: number, height: number, frameRate: number): number {
  const pixels = width * height;
  const base =
    pixels >= 3840 * 2160
      ? 45_000_000
      : pixels >= 2560 * 1440
        ? 28_000_000
        : pixels >= 1920 * 1080
          ? 18_000_000
          : 8_000_000;
  return Math.round(base * (frameRate >= 60 ? 1.45 : 1));
}
