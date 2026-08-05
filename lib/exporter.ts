import { qualityBitrate, selectRecorderMimeType } from "./capabilities";
import { calculateOutputSize, renderFrame } from "./render-frame";
import {
  activeSpeedAt,
  getEditedDuration,
  getScreenAsset,
  sourceTimeToTimelineTime,
  type VibeProject,
} from "./project";

type CapturableCanvas = HTMLCanvasElement & {
  captureStream(frameRate?: number): MediaStream;
};

export interface ExportProgress {
  phase: "preparing" | "rendering" | "finalizing";
  progress: number;
  elapsed: number;
  total: number;
}

export interface ExportOptions {
  project: VibeProject;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

function waitForEvent(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Media event failed: ${event}`));
    };
    const cleanup = () => {
      target.removeEventListener(event, onSuccess);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(event, onSuccess, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

export async function exportProject({ project, onProgress, signal }: ExportOptions): Promise<Blob> {
  const screenAsset = getScreenAsset(project);
  if (!screenAsset?.objectUrl) throw new Error("Add or record a screen video before exporting.");
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot encode the edited video.");
  }
  onProgress?.({ phase: "preparing", progress: 0, elapsed: 0, total: 0 });

  const screen = document.createElement("video");
  screen.src = screenAsset.objectUrl;
  screen.preload = "auto";
  screen.playsInline = true;
  screen.crossOrigin = "anonymous";
  const cameraAsset = project.assets.find((asset) => asset.id === project.webcam.assetId);
  const webcam = cameraAsset?.objectUrl ? document.createElement("video") : null;
  if (webcam && cameraAsset?.objectUrl) {
    webcam.src = cameraAsset.objectUrl;
    webcam.preload = "auto";
    webcam.playsInline = true;
    webcam.muted = true;
  }
  if (screen.readyState < HTMLMediaElement.HAVE_METADATA) {
    await waitForEvent(screen, "loadedmetadata");
  }
  if (webcam && webcam.readyState < HTMLMediaElement.HAVE_METADATA) {
    await waitForEvent(webcam, "loadedmetadata");
  }

  const output = calculateOutputSize(project, screenAsset);
  const canvas = document.createElement("canvas") as CapturableCanvas;
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Could not create the export canvas.");

  const frameRate = project.export.frameRate;
  const canvasStream = canvas.captureStream(frameRate);
  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioContext({ sampleRate: 48_000 });
    const source = audioContext.createMediaElementSource(screen);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
    await audioContext.resume();
  } catch {
    await audioContext?.close().catch(() => undefined);
    audioContext = null;
  }

  const mimeType = selectRecorderMimeType();
  const recorder = new MediaRecorder(canvasStream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: Math.max(
      project.export.videoBitrate,
      qualityBitrate(output.width, output.height, frameRate),
    ),
    audioBitsPerSecond: 192_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const start = Math.max(0, project.trim.start);
  const end = Math.min(
    project.trim.end > start ? project.trim.end : screen.duration,
    screen.duration,
  );
  const editedTotal = Math.max(0.01, getEditedDuration(project, screen.duration));
  screen.currentTime = start;
  if (webcam) webcam.currentTime = start;
  const initialSpeed = activeSpeedAt(project, start);
  screen.playbackRate = initialSpeed;
  if (webcam) webcam.playbackRate = initialSpeed;
  await Promise.all([
    waitForEvent(screen, "seeked"),
    webcam ? waitForEvent(webcam, "seeked") : Promise.resolve(),
  ]);

  return new Promise<Blob>((resolve, reject) => {
    let animationFrame = 0;
    let settled = false;
    const cleanUp = () => {
      cancelAnimationFrame(animationFrame);
      screen.pause();
      webcam?.pause();
      canvasStream.getTracks().forEach((track) => track.stop());
      void audioContext?.close().catch(() => undefined);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanUp();
      reject(error instanceof Error ? error : new Error("Video export failed."));
    };
    const finish = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.onerror = () => fail(new Error("The browser encoder stopped during export."));
    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      onProgress?.({ phase: "finalizing", progress: 1, elapsed: editedTotal, total: editedTotal });
      cleanUp();
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
    };
    const abort = () => {
      if (recorder.state !== "inactive") recorder.stop();
      fail(new DOMException("Export cancelled.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });

    const draw = () => {
      if (signal?.aborted) return;
      const time = screen.currentTime;
      const speed = activeSpeedAt(project, time);
      if (screen.playbackRate !== speed) screen.playbackRate = speed;
      if (webcam && webcam.playbackRate !== speed) webcam.playbackRate = speed;
      renderFrame(
        context,
        project,
        { screen, webcam },
        screenAsset,
        time,
        output,
      );
      const elapsed = Math.max(0, sourceTimeToTimelineTime(project, time, screen.duration));
      onProgress?.({
        phase: "rendering",
        progress: Math.min(elapsed / editedTotal, 0.995),
        elapsed,
        total: editedTotal,
      });
      if (screen.ended || time >= end - 1 / frameRate) {
        finish();
        return;
      }
      animationFrame = requestAnimationFrame(draw);
    };

    recorder.start(1_000);
    Promise.all([screen.play(), webcam?.play() ?? Promise.resolve()])
      .then(() => {
        draw();
      })
      .catch(fail);
  });
}

export async function saveBlob(blob: Blob, suggestedName: string): Promise<void> {
  const extension = blob.type.includes("mp4") ? "mp4" : "webm";
  const filename = `${suggestedName.replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "-") || "vibe-screen"}.${extension}`;
  if ("showSaveFilePicker" in window) {
    const picker = (
      window as typeof window & {
        showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle>;
      }
    ).showSaveFilePicker;
    const handle = await picker({
      suggestedName: filename,
      types: [
        {
          description: "Video",
          accept: { [blob.type || "video/webm"]: [`.${extension}`] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
