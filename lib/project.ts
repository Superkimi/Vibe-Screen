export const PROJECT_VERSION = 2 as const;

export type AspectRatio = "source" | "16:9" | "9:16" | "1:1" | "4:3";
export type BackgroundKind = "solid" | "gradient";
export type AssetKind = "screen" | "camera" | "video" | "image";
export type ExportQuality = "720p" | "1080p" | "1440p" | "2160p" | "source";
export type ExportFrameRate = 30 | 60;
export type WebcamShape = "circle" | "rounded" | "square";
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  name: string;
  mimeType: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  createdAt: string;
  objectUrl?: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  background: string;
  align: "left" | "center" | "right";
}

export interface ZoomRegion {
  id: string;
  start: number;
  end: number;
  scale: number;
  x: number;
  y: number;
}

export interface SpeedRegion {
  id: string;
  start: number;
  end: number;
  speed: PlaybackSpeed;
}

export interface EditorAppearance {
  aspectRatio: AspectRatio;
  backgroundKind: BackgroundKind;
  background: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  padding: number;
  radius: number;
  shadow: number;
}

export interface WebcamSettings {
  enabled: boolean;
  assetId: string | null;
  x: number;
  y: number;
  size: number;
  shape: WebcamShape;
  mirrored: boolean;
}

export interface ExportSettings {
  quality: ExportQuality;
  frameRate: ExportFrameRate;
  videoBitrate: number;
}

export interface VibeProject {
  version: typeof PROJECT_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  assets: MediaAsset[];
  screenAssetId: string | null;
  trim: { start: number; end: number };
  appearance: EditorAppearance;
  webcam: WebcamSettings;
  textOverlays: TextOverlay[];
  zoomRegions: ZoomRegion[];
  speedRegions: SpeedRegion[];
  export: ExportSettings;
}

const now = () => new Date().toISOString();

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyProject(name = "Untitled recording"): VibeProject {
  const createdAt = now();
  return {
    version: PROJECT_VERSION,
    id: createId("project"),
    name,
    createdAt,
    updatedAt: createdAt,
    assets: [],
    screenAssetId: null,
    trim: { start: 0, end: 0 },
    appearance: {
      aspectRatio: "source",
      backgroundKind: "gradient",
      background: "#ddd6fe",
      gradientFrom: "#e9e3ff",
      gradientTo: "#b8a7e8",
      gradientAngle: 135,
      padding: 7,
      radius: 18,
      shadow: 35,
    },
    webcam: {
      enabled: false,
      assetId: null,
      x: 82,
      y: 78,
      size: 20,
      shape: "circle",
      mirrored: true,
    },
    textOverlays: [],
    zoomRegions: [],
    speedRegions: [],
    export: {
      quality: "1080p",
      frameRate: 60,
      videoBitrate: 20_000_000,
    },
  };
}

export function normalizeProject(input: unknown): VibeProject {
  if (!input || typeof input !== "object") return createEmptyProject();
  const candidate = input as Partial<VibeProject>;
  const base = createEmptyProject(
    typeof candidate.name === "string" ? candidate.name.slice(0, 120) : undefined,
  );
  const normalizeRegion = (region: unknown): SpeedRegion | null => {
    if (!region || typeof region !== "object") return null;
    const value = region as Partial<SpeedRegion>;
    if (typeof value.id !== "string") return null;
    const start = Number.isFinite(value.start) ? Math.max(0, Number(value.start)) : 0;
    const end = Number.isFinite(value.end) ? Math.max(start + 0.05, Number(value.end)) : start + 1;
    const speed = PLAYBACK_SPEEDS.includes(value.speed as PlaybackSpeed)
      ? (value.speed as PlaybackSpeed)
      : 1.5;
    return { id: value.id, start, end, speed };
  };
  return {
    ...base,
    ...candidate,
    version: PROJECT_VERSION,
    assets: Array.isArray(candidate.assets) ? candidate.assets : [],
    appearance: { ...base.appearance, ...(candidate.appearance ?? {}) },
    webcam: { ...base.webcam, ...(candidate.webcam ?? {}) },
    export: { ...base.export, ...(candidate.export ?? {}) },
    textOverlays: Array.isArray(candidate.textOverlays) ? candidate.textOverlays : [],
    zoomRegions: Array.isArray(candidate.zoomRegions) ? candidate.zoomRegions : [],
    speedRegions: Array.isArray(candidate.speedRegions)
      ? candidate.speedRegions.map(normalizeRegion).filter((region): region is SpeedRegion => Boolean(region))
      : [],
    trim: { ...base.trim, ...(candidate.trim ?? {}) },
  };
}

interface SpeedSegment {
  start: number;
  end: number;
  speed: PlaybackSpeed;
}

function getTrimRange(project: VibeProject, sourceDuration: number) {
  const safeDuration = Math.max(0, Number.isFinite(sourceDuration) ? sourceDuration : 0);
  const start = Math.min(Math.max(project.trim.start, 0), safeDuration);
  const end = Math.min(
    Math.max(project.trim.end > start ? project.trim.end : safeDuration, start),
    safeDuration,
  );
  return { start, end };
}

function getSpeedSegments(project: VibeProject, sourceDuration: number): SpeedSegment[] {
  const { start, end } = getTrimRange(project, sourceDuration);
  if (end <= start) return [];
  const boundaries = new Set<number>([start, end]);
  for (const region of project.speedRegions) {
    if (region.end <= start || region.start >= end) continue;
    boundaries.add(Math.max(start, region.start));
    boundaries.add(Math.min(end, region.end));
  }
  const points = [...boundaries].sort((left, right) => left - right);
  const segments: SpeedSegment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const segmentStart = points[index];
    const segmentEnd = points[index + 1];
    if (segmentEnd - segmentStart <= 0.0001) continue;
    const middle = (segmentStart + segmentEnd) / 2;
    const region = [...project.speedRegions]
      .reverse()
      .find((candidate) => middle >= candidate.start && middle <= candidate.end);
    segments.push({ start: segmentStart, end: segmentEnd, speed: region?.speed ?? 1 });
  }
  return segments;
}

export function activeSpeedAt(project: VibeProject, time: number): PlaybackSpeed {
  return (
    [...project.speedRegions]
      .reverse()
      .find((region) => time >= region.start && time <= region.end)?.speed ?? 1
  );
}

export function getEditedDuration(project: VibeProject, sourceDuration: number): number {
  return getSpeedSegments(project, sourceDuration).reduce(
    (total, segment) => total + (segment.end - segment.start) / segment.speed,
    0,
  );
}

export function sourceTimeToTimelineTime(
  project: VibeProject,
  sourceTime: number,
  sourceDuration: number,
): number {
  const segments = getSpeedSegments(project, sourceDuration);
  if (segments.length === 0) return 0;
  const safeTime = Math.min(Math.max(sourceTime, segments[0].start), segments.at(-1)?.end ?? sourceTime);
  let timelineTime = 0;
  for (const segment of segments) {
    if (safeTime >= segment.end) {
      timelineTime += (segment.end - segment.start) / segment.speed;
      continue;
    }
    timelineTime += Math.max(0, safeTime - segment.start) / segment.speed;
    break;
  }
  return timelineTime;
}

export function timelineTimeToSourceTime(
  project: VibeProject,
  timelineTime: number,
  sourceDuration: number,
): number {
  const segments = getSpeedSegments(project, sourceDuration);
  if (segments.length === 0) return getTrimRange(project, sourceDuration).start;
  let remaining = Math.max(0, timelineTime);
  for (const segment of segments) {
    const timelineLength = (segment.end - segment.start) / segment.speed;
    if (remaining <= timelineLength) return segment.start + remaining * segment.speed;
    remaining -= timelineLength;
  }
  return segments.at(-1)?.end ?? 0;
}

export function touchProject(project: VibeProject): VibeProject {
  return { ...project, updatedAt: now() };
}

export function getScreenAsset(project: VibeProject): MediaAsset | null {
  return project.assets.find((asset) => asset.id === project.screenAssetId) ?? null;
}

export function getAspectRatioValue(aspectRatio: AspectRatio, sourceRatio: number): number {
  const ratios: Record<Exclude<AspectRatio, "source">, number> = {
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "1:1": 1,
    "4:3": 4 / 3,
  };
  return aspectRatio === "source" ? sourceRatio : ratios[aspectRatio];
}

export function clampTime(value: number, duration: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), Math.max(duration, 0));
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * 100);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(frames).padStart(2, "0")}`;
}
