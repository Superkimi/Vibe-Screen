import { createId, type AssetKind, type MediaAsset } from "./project";

export async function readVideoMetadata(
  blob: Blob,
): Promise<{ duration: number; width: number; height: number; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.src = objectUrl;
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      resolve({
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        objectUrl,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected video could not be decoded by this browser."));
    };
  });
}

export async function createMediaAsset(
  blob: Blob,
  name: string,
  kind: AssetKind,
): Promise<MediaAsset> {
  const metadata = await readVideoMetadata(blob);
  return {
    id: createId(kind),
    kind,
    name,
    mimeType: blob.type || "video/webm",
    size: blob.size,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    objectUrl: metadata.objectUrl,
    createdAt: new Date().toISOString(),
  };
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
