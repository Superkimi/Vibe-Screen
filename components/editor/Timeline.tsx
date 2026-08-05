"use client";

import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Scissors,
  FastForward,
  TextT,
  VideoCamera,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { clampTime, formatTime, getScreenAsset } from "@/lib/project";
import { useEditor } from "./EditorContext";
import { useEditorCopy } from "./EditorI18n";

export function Timeline() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const asset = getScreenAsset(state.project);
  const duration = asset?.duration ?? 0;
  const [scale, setScale] = useState(1);
  const rows = useMemo(
    () => [
      { id: "video", label: copy.timeline.screen, icon: <VideoCamera size={15} /> },
      { id: "zoom", label: copy.inspector.panel.zoom, icon: <MagnifyingGlassPlus size={15} /> },
      { id: "text", label: copy.timeline.text, icon: <TextT size={15} /> },
      { id: "speed", label: copy.timeline.speed, icon: <FastForward size={15} /> },
    ],
    [copy.inspector.panel.zoom, copy.timeline.screen, copy.timeline.speed, copy.timeline.text],
  );

  const seekFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    dispatch({ type: "SEEK", time: ratio * duration });
  };

  return (
    <section className="timeline-shell" aria-label={copy.timeline.aria}>
      <header className="timeline-header">
        <div className="timeline-tools">
          <button
            className="icon-button"
            aria-label={copy.timeline.addZoom}
            disabled={!asset}
            onClick={() => dispatch({ type: "ADD_ZOOM" })}
          >
            <MagnifyingGlassPlus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={copy.timeline.addText}
            disabled={!asset}
            onClick={() => dispatch({ type: "ADD_TEXT" })}
          >
            <TextT size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={copy.timeline.addSpeed}
            disabled={!asset}
            onClick={() => dispatch({ type: "ADD_SPEED" })}
          >
            <FastForward size={17} />
          </button>
          <span className="timeline-time">{formatTime(state.currentTime)}</span>
        </div>
        <div className="timeline-zoom">
          <MagnifyingGlassMinus size={14} />
          <input
            type="range"
            min="0.75"
            max="2"
            step="0.05"
            value={scale}
            aria-label={copy.timeline.zoom}
            onChange={(event) => setScale(Number(event.target.value))}
          />
          <MagnifyingGlassPlus size={14} />
        </div>
      </header>
      <div className="timeline-body">
        <div className="timeline-labels">
          {rows.map((row) => (
            <div key={row.id}>
              {row.icon}
              <span>{row.label}</span>
            </div>
          ))}
        </div>
        <div className="timeline-scroll">
          <div
            className="timeline-tracks"
            style={{ width: `${Math.max(100, scale * 100)}%` }}
            onPointerDown={seekFromPointer}
          >
            <TimelineRuler duration={duration} />
            {asset ? (
              <>
                <div className="timeline-row video-row">
                  <button
                    className="video-clip"
                    style={{
                      left: `${(state.project.trim.start / duration) * 100}%`,
                      width: `${((state.project.trim.end - state.project.trim.start) / duration) * 100}%`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      dispatch({ type: "SET_PANEL", panel: "media" });
                    }}
                  >
                    <Scissors size={13} />
                    <span>{asset.name}</span>
                  </button>
                </div>
                <div className="timeline-row zoom-row">
                  {state.project.zoomRegions.map((region) => (
                    <button
                      key={region.id}
                      className={`region zoom-region ${state.selectedId === region.id ? "selected" : ""}`}
                      style={{
                        left: `${(region.start / duration) * 100}%`,
                        width: `${Math.max(((region.end - region.start) / duration) * 100, 1.5)}%`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: "SELECT", id: region.id });
                        dispatch({ type: "SET_PANEL", panel: "zoom" });
                      }}
                    >
                      {region.scale.toFixed(1)}×
                    </button>
                  ))}
                </div>
                <div className="timeline-row text-row">
                  {state.project.textOverlays.map((overlay) => (
                    <button
                      key={overlay.id}
                      className={`region text-region ${state.selectedId === overlay.id ? "selected" : ""}`}
                      style={{
                        left: `${(overlay.start / duration) * 100}%`,
                        width: `${Math.max(((overlay.end - overlay.start) / duration) * 100, 1.5)}%`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: "SELECT", id: overlay.id });
                        dispatch({ type: "SET_PANEL", panel: "text" });
                      }}
                    >
                      {overlay.text || copy.timeline.text}
                    </button>
                  ))}
                </div>
                <div className="timeline-row speed-row">
                  {state.project.speedRegions.map((region) => (
                    <button
                      key={region.id}
                      className={`region speed-region ${state.selectedId === region.id ? "selected" : ""}`}
                      style={{
                        left: `${(region.start / duration) * 100}%`,
                        width: `${Math.max(((region.end - region.start) / duration) * 100, 1.5)}%`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: "SELECT", id: region.id });
                        dispatch({ type: "SET_PANEL", panel: "speed" });
                      }}
                    >
                      {region.speed}×
                    </button>
                  ))}
                </div>
                <div
                  className="playhead"
                  style={{ left: `${(clampTime(state.currentTime, duration) / duration) * 100}%` }}
                >
                  <i />
                </div>
              </>
            ) : (
              <div className="timeline-empty">{copy.timeline.empty}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineRuler({ duration }: { duration: number }) {
  const marks = useMemo(() => {
    if (!duration) return [];
    const interval = duration <= 30 ? 5 : duration <= 120 ? 10 : 30;
    return Array.from({ length: Math.ceil(duration / interval) + 1 }, (_, index) => {
      const time = Math.min(index * interval, duration);
      return { time, left: (time / duration) * 100 };
    });
  }, [duration]);
  return (
    <div className="timeline-ruler">
      {marks.map((mark) => (
        <span key={mark.time} style={{ left: `${mark.left}%` }}>
          {formatTime(mark.time).slice(0, 5)}
        </span>
      ))}
    </div>
  );
}
