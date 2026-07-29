import {
  getAspectRatioValue,
  type MediaAsset,
  type VibeProject,
  type ZoomRegion,
} from "./project";

export interface OutputSize {
  width: number;
  height: number;
}

export interface FrameSources {
  screen: CanvasImageSource;
  webcam?: CanvasImageSource | null;
}

export function calculateOutputSize(
  project: VibeProject,
  source: Pick<MediaAsset, "width" | "height">,
): OutputSize {
  if (project.export.quality === "source" && project.appearance.aspectRatio === "source") {
    return ensureEven({ width: source.width, height: source.height });
  }
  const longEdges = {
    "720p": 1280,
    "1080p": 1920,
    "1440p": 2560,
    "2160p": 3840,
    source: Math.max(source.width, source.height),
  };
  const longEdge = longEdges[project.export.quality];
  const ratio = getAspectRatioValue(
    project.appearance.aspectRatio,
    source.width / Math.max(source.height, 1),
  );
  return ensureEven(
    ratio >= 1
      ? { width: longEdge, height: Math.round(longEdge / ratio) }
      : { width: Math.round(longEdge * ratio), height: longEdge },
  );
}

function ensureEven(size: OutputSize): OutputSize {
  return {
    width: Math.max(2, Math.round(size.width / 2) * 2),
    height: Math.max(2, Math.round(size.height / 2) * 2),
  };
}

export function activeZoomAt(project: VibeProject, time: number): ZoomRegion | null {
  return (
    [...project.zoomRegions]
      .reverse()
      .find((region) => time >= region.start && time <= region.end) ?? null
  );
}

export function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(Math.max(radius, 0), width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function fillBackground(
  context: CanvasRenderingContext2D,
  project: VibeProject,
  width: number,
  height: number,
): void {
  if (project.appearance.backgroundKind === "solid") {
    context.fillStyle = project.appearance.background;
  } else {
    const angle = (project.appearance.gradientAngle * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const dx = Math.cos(angle) * width;
    const dy = Math.sin(angle) * height;
    const gradient = context.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    gradient.addColorStop(0, project.appearance.gradientFrom);
    gradient.addColorStop(1, project.appearance.gradientTo);
    context.fillStyle = gradient;
  }
  context.fillRect(0, 0, width, height);
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  target: { x: number; y: number; width: number; height: number },
  zoom: ZoomRegion | null,
): void {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = target.width / target.height;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceRatio > targetRatio) cropWidth = sourceHeight * targetRatio;
  else cropHeight = sourceWidth / targetRatio;

  const scale = zoom?.scale ?? 1;
  cropWidth /= scale;
  cropHeight /= scale;
  const focusX = ((zoom?.x ?? 50) / 100) * sourceWidth;
  const focusY = ((zoom?.y ?? 50) / 100) * sourceHeight;
  const sx = Math.min(Math.max(focusX - cropWidth / 2, 0), sourceWidth - cropWidth);
  const sy = Math.min(Math.max(focusY - cropHeight / 2, 0), sourceHeight - cropHeight);
  context.drawImage(
    source,
    sx,
    sy,
    cropWidth,
    cropHeight,
    target.x,
    target.y,
    target.width,
    target.height,
  );
}

function drawWebcam(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  project: VibeProject,
  output: OutputSize,
): void {
  const side = (project.webcam.size / 100) * Math.min(output.width, output.height);
  const x = (project.webcam.x / 100) * output.width - side / 2;
  const y = (project.webcam.y / 100) * output.height - side / 2;
  context.save();
  context.shadowColor = "rgba(27, 21, 40, .34)";
  context.shadowBlur = side * 0.08;
  context.shadowOffsetY = side * 0.035;
  const radius =
    project.webcam.shape === "circle"
      ? side / 2
      : project.webcam.shape === "rounded"
        ? side * 0.17
        : 0;
  roundedRectPath(context, x, y, side, side, radius);
  context.clip();
  if (project.webcam.mirrored) {
    context.translate(x * 2 + side, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, x, y, side, side);
  context.restore();
}

function drawTextOverlays(
  context: CanvasRenderingContext2D,
  project: VibeProject,
  time: number,
  output: OutputSize,
): void {
  for (const overlay of project.textOverlays) {
    if (time < overlay.start || time > overlay.end) continue;
    const width = (overlay.width / 100) * output.width;
    const x = (overlay.x / 100) * output.width - width / 2;
    const y = (overlay.y / 100) * output.height;
    const fontSize = overlay.fontSize * (output.width / 1920);
    const padding = Math.max(12, fontSize * 0.4);
    context.save();
    context.font = `${overlay.fontWeight} ${fontSize}px "Arial", sans-serif`;
    context.textAlign = overlay.align;
    context.textBaseline = "middle";
    const lines = overlay.text.split("\n").slice(0, 4);
    const lineHeight = fontSize * 1.15;
    const blockHeight = lines.length * lineHeight + padding * 2;
    context.fillStyle = overlay.background;
    roundedRectPath(context, x, y, width, blockHeight, fontSize * 0.25);
    context.fill();
    context.fillStyle = overlay.color;
    const textX =
      overlay.align === "left"
        ? x + padding
        : overlay.align === "right"
          ? x + width - padding
          : x + width / 2;
    lines.forEach((line, index) => {
      context.fillText(line, textX, y + padding + lineHeight * (index + 0.5), width - padding * 2);
    });
    context.restore();
  }
}

export function renderFrame(
  context: CanvasRenderingContext2D,
  project: VibeProject,
  sources: FrameSources,
  sourceSize: Pick<MediaAsset, "width" | "height">,
  time: number,
  output: OutputSize,
): void {
  context.clearRect(0, 0, output.width, output.height);
  fillBackground(context, project, output.width, output.height);
  const padding = (project.appearance.padding / 100) * Math.min(output.width, output.height);
  const target = {
    x: padding,
    y: padding,
    width: output.width - padding * 2,
    height: output.height - padding * 2,
  };
  const radius = (project.appearance.radius / 100) * Math.min(target.width, target.height) * 0.2;
  context.save();
  if (project.appearance.shadow > 0) {
    context.shadowColor = `rgba(31, 24, 48, ${project.appearance.shadow / 160})`;
    context.shadowBlur = (project.appearance.shadow / 100) * Math.min(output.width, output.height) * 0.12;
    context.shadowOffsetY = context.shadowBlur * 0.35;
  }
  roundedRectPath(context, target.x, target.y, target.width, target.height, radius);
  context.clip();
  drawCover(
    context,
    sources.screen,
    sourceSize.width,
    sourceSize.height,
    target,
    activeZoomAt(project, time),
  );
  context.restore();
  if (project.webcam.enabled && sources.webcam) {
    drawWebcam(context, sources.webcam, project, output);
  }
  drawTextOverlays(context, project, time, output);
}
