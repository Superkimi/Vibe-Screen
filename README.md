# Vibe Screen

Vibe Screen is a local-first browser screen recorder and video editor. It
captures a tab, window, or display, keeps camera footage as an editable layer,
and renders the final composition on the user's machine.

## What works in the first release

- Browser screen capture with optional microphone, shared audio, and camera
- 30 fps or 60 fps high-bitrate MediaRecorder capture
- Local media directory with import and project autosave in IndexedDB
- Canvas preview with aspect ratio, background, padding, radius, and shadow
- Independent camera overlay with position, size, shape, and mirroring
- Timeline trim, focus zoom regions, local speed regions, and editable text layers
- Smooth zoom entry/exit and speed-aware preview/export timing
- Undo and redo for project edits
- Local 720p, 1080p, 1440p, 4K, or source-resolution export
- Explicit bitrate and frame-rate controls
- Responsive bilingual-ready marketing surface in the aiHubHub visual family

## Browser support

Chrome and Edge provide the complete experience. The application detects the
available Screen Capture, MediaRecorder, Canvas Capture, File System Access,
IndexedDB, and WebCodecs capabilities at runtime.

Browser security intentionally limits what a web application can capture.
System audio availability depends on the chosen source and operating system.
Browsers also do not expose the same native cursor telemetry and clean
window-level capture pipeline available to Electron applications.

The first release uses a real-time canvas render for dependable audio and visual
composition across current Chromium browsers. The architecture keeps the frame
renderer separate so a WebCodecs accelerated exporter can replace that path
without changing project data or the editor.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:30242`.

Screen recording requires a secure context. `localhost` is accepted during
development; production must use HTTPS.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
```

## Deployment

The default production route is:

- Marketing: `https://aihubhub.com/vibe-screen`
- Studio: `https://aihubhub.com/vibe-screen/studio`

Build a standalone release under that path:

```bash
NEXT_PUBLIC_BASE_PATH=/vibe-screen npm run build
```

Build a static GitHub Pages release:

```bash
NEXT_PUBLIC_BASE_PATH=/Vibe-Screen STATIC_EXPORT=1 npm run build
```

## Design lineage

The project was informed by the MIT-licensed OpenScreen desktop application's
separation of recording, editor state, rendering, timeline regions, and export.
See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

MIT
