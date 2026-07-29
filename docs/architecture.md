# Vibe Screen architecture

Vibe Screen is a local-first browser recorder and editor. Media stays in the
browser unless the user explicitly saves or downloads an export.

## Reference study

The product architecture was informed by OpenScreen's separation of recording,
editor state, canvas rendering, timeline regions, and export. Vibe Screen is an
independent implementation and does not copy OpenScreen source code.

Electron-specific facilities were deliberately replaced:

| Desktop responsibility | Web implementation |
| --- | --- |
| Native capture bridge | `getDisplayMedia()` and `getUserMedia()` |
| Desktop audio routing | Browser-provided system audio plus Web Audio mixing |
| Native filesystem | IndexedDB and the File System Access API when available |
| Desktop compositor | Canvas 2D preview and `captureStream()` export |
| Native encoding | `MediaRecorder`, with a future WebCodecs acceleration path |

The first release targets current Chromium browsers. It feature-detects capture,
recording, camera, system-audio, WebCodecs, and direct-file-save support instead
of assuming they are all present.

## Data flow

1. `RecorderController` requests a display stream and optional microphone and
   camera streams.
2. System audio and microphone audio are mixed through a Web Audio graph.
3. The recording is stored as a blob in IndexedDB and referenced by the project
   document.
4. The editor reducer owns serializable project state and undo/redo history.
5. The preview and exporter share `renderFrame()` so exported composition
   matches the canvas.
6. The exporter advances a deterministic playhead, draws each video frame to a
   canvas, mixes source audio, and records the resulting canvas stream.

## Quality and performance choices

- Preview rendering is capped by the browser animation loop and pauses when the
  document is hidden.
- Source videos are decoded by the browser rather than copied into JavaScript
  frame buffers.
- The editor stores blobs separately from project JSON, avoiding base64 memory
  inflation.
- Export bitrate scales with selected resolution and frame rate.
- 720p, 1080p, and 4K presets are available; practical 4K speed depends on the
  device's decoder and encoder.
- The landing page uses self-hosted variable fonts and compressed product
  screenshots.

## Browser boundaries

The web platform can produce strong screen recordings, but it cannot promise
every Electron capability:

- The user must choose the capture target in a browser-owned permission dialog.
- System-audio availability depends on browser, operating system, and selected
  source.
- Browsers do not expose complete native cursor telemetry or cursor-shape data,
  so this release provides manual zoom regions rather than desktop-grade
  automatic cursor zoom.
- A tab cannot silently recapture a protected or permission-restricted source.

These constraints are surfaced in the recorder capability check and degrade
gracefully rather than blocking editing or import.

## Primary platform references

- [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)
- [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [Chrome WebCodecs best practices](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs)
