"use client";

import { ArrowsOut, Play, Pause, Plus, Record } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAspectRatioValue, getScreenAsset } from "@/lib/project";
import { renderFrame } from "@/lib/render-frame";
import { useEditor } from "./EditorContext";
import { useEditorCopy } from "./EditorI18n";
import { RecorderDialog } from "./RecorderDialog";

export function CanvasWorkspace() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const screenAsset = getScreenAsset(state.project);
  const cameraAsset = state.project.assets.find((asset) => asset.id === state.project.webcam.assetId);
  const screenRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastReportedTime = useRef(0);
  const [recordOpen, setRecordOpen] = useState(false);
  const [zoom, setZoom] = useState(76);
  const ratio = screenAsset
    ? getAspectRatioValue(
        state.project.appearance.aspectRatio,
        screenAsset.width / Math.max(screenAsset.height, 1),
      )
    : 16 / 9;

  const draw = useCallback(() => {
    const screen = screenRef.current;
    const canvas = canvasRef.current;
    if (!screen || !canvas || !screenAsset || screen.readyState < 2) return;
    const outputWidth = 1280;
    const outputHeight = Math.max(2, Math.round(outputWidth / ratio));
    if (canvas.width !== outputWidth || canvas.height !== outputHeight) {
      canvas.width = outputWidth;
      canvas.height = outputHeight;
    }
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    renderFrame(
      context,
      state.project,
      { screen, webcam: webcamRef.current },
      screenAsset,
      screen.currentTime,
      { width: outputWidth, height: outputHeight },
    );
  }, [ratio, screenAsset, state.project]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || !screenAsset?.objectUrl) return;
    if (Math.abs(screen.currentTime - state.currentTime) > 0.14 && !state.isPlaying) {
      screen.currentTime = Math.min(state.currentTime, screen.duration || state.currentTime);
      if (webcamRef.current) webcamRef.current.currentTime = screen.currentTime;
    }
    draw();
  }, [draw, screenAsset?.objectUrl, state.currentTime, state.isPlaying]);

  useEffect(() => {
    const screen = screenRef.current;
    const webcam = webcamRef.current;
    if (!screen) return;
    if (state.isPlaying) {
      if (screen.currentTime < state.project.trim.start || screen.currentTime >= state.project.trim.end) {
        screen.currentTime = state.project.trim.start;
        if (webcam) webcam.currentTime = state.project.trim.start;
      }
      void screen.play();
      if (webcam) void webcam.play();
      const animate = () => {
        if (
          screen.currentTime >= state.project.trim.end ||
          screen.ended
        ) {
          screen.pause();
          webcam?.pause();
          dispatch({ type: "SET_PLAYING", value: false });
          dispatch({ type: "SEEK", time: state.project.trim.start });
          return;
        }
        draw();
        if (Math.abs(screen.currentTime - lastReportedTime.current) > 0.08) {
          lastReportedTime.current = screen.currentTime;
          dispatch({ type: "SEEK", time: screen.currentTime });
        }
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);
    } else {
      screen.pause();
      webcam?.pause();
      cancelAnimationFrame(frameRef.current);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [
    dispatch,
    draw,
    state.isPlaying,
    state.project.trim.end,
    state.project.trim.start,
  ]);

  return (
    <main className="canvas-workspace">
      <div className="canvas-toolbar">
        <div>
          <button className="icon-button" aria-label={copy.canvas.fit} onClick={() => setZoom(76)}>
            <ArrowsOut size={17} />
          </button>
          <span>{zoom}%</span>
        </div>
        <input
          aria-label={copy.canvas.zoom}
          type="range"
          min="40"
          max="110"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </div>
      <section className="canvas-stage">
        {screenAsset?.objectUrl ? (
          <div
            className="canvas-frame"
            style={{
              width: `${zoom}%`,
              aspectRatio: `${ratio}`,
            }}
          >
            <canvas ref={canvasRef} aria-label={copy.canvas.preview} />
            <video
              ref={screenRef}
              src={screenAsset.objectUrl}
              muted
              playsInline
              preload="auto"
              onLoadedData={draw}
              hidden
            />
            {cameraAsset?.objectUrl && (
              <video
                ref={webcamRef}
                src={cameraAsset.objectUrl}
                muted
                playsInline
                preload="auto"
                onLoadedData={draw}
                hidden
              />
            )}
          </div>
        ) : (
          <div className="canvas-empty">
            <span className="empty-symbol"><Record size={28} weight="fill" /></span>
            <h2>{copy.canvas.emptyTitle}</h2>
            <p>{copy.canvas.emptyBody}</p>
            <div>
              <button className="primary-button" onClick={() => setRecordOpen(true)}>
                <Record size={17} weight="fill" />
                {copy.canvas.startRecording}
              </button>
              <button className="secondary-button" onClick={() => document.querySelector<HTMLInputElement>(".media-rail input[type=file]")?.click()}>
                <Plus size={17} />
                {copy.canvas.importVideo}
              </button>
            </div>
          </div>
        )}
      </section>
      {screenAsset && (
        <div className="floating-playback">
          <button
            className="play-button"
            aria-label={state.isPlaying ? copy.canvas.pause : copy.canvas.play}
            onClick={() => dispatch({ type: "SET_PLAYING", value: !state.isPlaying })}
          >
            {state.isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </button>
        </div>
      )}
      <RecorderDialog open={recordOpen} onClose={() => setRecordOpen(false)} />
    </main>
  );
}
