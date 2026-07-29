import { selectRecorderMimeType } from "./capabilities";
import { stopStream } from "./media";

export interface RecordingOptions {
  microphone: boolean;
  camera: boolean;
  systemAudio: boolean;
  microphoneDeviceId?: string;
  cameraDeviceId?: string;
  frameRate: 30 | 60;
}

export interface ActiveRecording {
  screenStream: MediaStream;
  cameraStream: MediaStream | null;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<RecordedSession>;
  cancel: () => void;
  state: () => RecordingState;
}

export interface RecordedSession {
  screen: Blob;
  camera: Blob | null;
  duration: number;
}

export type RecordingState = "recording" | "paused" | "inactive";

interface ChunkRecorder {
  recorder: MediaRecorder;
  chunks: Blob[];
}

function createChunkRecorder(stream: MediaStream, mimeType: string, bitrate: number): ChunkRecorder {
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: bitrate,
    audioBitsPerSecond: 192_000,
  });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.start(1_000);
  return { recorder, chunks };
}

function stopRecorder(handle: ChunkRecorder, mimeType: string): Promise<Blob> {
  if (handle.recorder.state === "inactive") {
    return Promise.resolve(new Blob(handle.chunks, { type: mimeType || "video/webm" }));
  }
  return new Promise((resolve, reject) => {
    handle.recorder.onerror = () => reject(new Error("The browser recorder stopped unexpectedly."));
    handle.recorder.onstop = () =>
      resolve(new Blob(handle.chunks, { type: handle.recorder.mimeType || mimeType || "video/webm" }));
    handle.recorder.stop();
  });
}

async function createMixedScreenStream(
  display: MediaStream,
  microphone: MediaStream | null,
): Promise<{ stream: MediaStream; audioContext: AudioContext | null }> {
  const videoTracks = display.getVideoTracks();
  const audioTracks = [...display.getAudioTracks(), ...(microphone?.getAudioTracks() ?? [])];
  if (audioTracks.length <= 1) {
    return {
      stream: new MediaStream([...videoTracks, ...audioTracks]),
      audioContext: null,
    };
  }

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  for (const track of audioTracks) {
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    const gain = audioContext.createGain();
    gain.gain.value = microphone?.getAudioTracks().includes(track) ? 1.08 : 0.92;
    source.connect(gain).connect(destination);
  }
  await audioContext.resume();
  return {
    stream: new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]),
    audioContext,
  };
}

export async function startScreenRecording(options: RecordingOptions): Promise<ActiveRecording> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("This browser does not support screen capture.");
  }
  const displayOptions = {
    video: {
      frameRate: { ideal: options.frameRate, max: options.frameRate },
      width: { ideal: 3840 },
      height: { ideal: 2160 },
    },
    audio: options.systemAudio,
    systemAudio: options.systemAudio ? "include" : "exclude",
    surfaceSwitching: "include",
    selfBrowserSurface: "exclude",
  } as DisplayMediaStreamOptions;

  const display = await navigator.mediaDevices.getDisplayMedia(displayOptions);
  let microphone: MediaStream | null = null;
  let camera: MediaStream | null = null;
  try {
    if (options.microphone) {
      microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: options.microphoneDeviceId
            ? { exact: options.microphoneDeviceId }
            : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48_000,
        },
      });
    }
    if (options.camera) {
      camera = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: options.cameraDeviceId ? { exact: options.cameraDeviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
    }
  } catch (error) {
    stopStream(display);
    stopStream(microphone);
    stopStream(camera);
    throw error;
  }

  const { stream, audioContext } = await createMixedScreenStream(display, microphone);
  const mimeType = selectRecorderMimeType();
  const screenRecorder = createChunkRecorder(stream, mimeType, 28_000_000);
  const cameraRecorder = camera ? createChunkRecorder(camera, mimeType, 8_000_000) : null;
  const startedAt = performance.now();
  let pausedAt: number | null = null;
  let pausedDuration = 0;
  let cancelled = false;

  display.getVideoTracks()[0]?.addEventListener("ended", () => {
    if (screenRecorder.recorder.state !== "inactive") screenRecorder.recorder.stop();
  });

  const cleanUp = async () => {
    stopStream(display);
    stopStream(stream);
    stopStream(microphone);
    stopStream(camera);
    if (audioContext) await audioContext.close().catch(() => undefined);
  };

  return {
    screenStream: display,
    cameraStream: camera,
    pause() {
      if (screenRecorder.recorder.state !== "recording") return;
      screenRecorder.recorder.pause();
      cameraRecorder?.recorder.pause();
      pausedAt = performance.now();
    },
    resume() {
      if (screenRecorder.recorder.state !== "paused") return;
      screenRecorder.recorder.resume();
      cameraRecorder?.recorder.resume();
      if (pausedAt !== null) pausedDuration += performance.now() - pausedAt;
      pausedAt = null;
    },
    async stop() {
      const stoppedAt = performance.now();
      if (pausedAt !== null) pausedDuration += stoppedAt - pausedAt;
      const [screenBlob, cameraBlob] = await Promise.all([
        stopRecorder(screenRecorder, mimeType),
        cameraRecorder ? stopRecorder(cameraRecorder, mimeType) : Promise.resolve(null),
      ]);
      await cleanUp();
      if (cancelled) throw new Error("Recording was cancelled.");
      return {
        screen: screenBlob,
        camera: cameraBlob,
        duration: Math.max(0, (stoppedAt - startedAt - pausedDuration) / 1000),
      };
    },
    cancel() {
      cancelled = true;
      if (screenRecorder.recorder.state !== "inactive") screenRecorder.recorder.stop();
      if (cameraRecorder && cameraRecorder.recorder.state !== "inactive") {
        cameraRecorder.recorder.stop();
      }
      void cleanUp();
    },
    state() {
      return screenRecorder.recorder.state;
    },
  };
}
