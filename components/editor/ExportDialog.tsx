"use client";

import { CheckCircle, Export, X } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { exportProject, saveBlob, type ExportProgress } from "@/lib/exporter";
import { formatTime } from "@/lib/project";
import { useEditor } from "./EditorContext";

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useEditor();
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const abortController = useRef<AbortController | null>(null);

  if (!open) return null;

  const start = async () => {
    setError("");
    setComplete(false);
    setExportedBlob(null);
    abortController.current = new AbortController();
    try {
      const blob = await exportProject({
        project: state.project,
        signal: abortController.current.signal,
        onProgress: setProgress,
      });
      setExportedBlob(blob);
      setComplete(true);
      await saveBlob(blob, state.project.name);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "The video could not be exported.");
    }
  };

  const close = () => {
    abortController.current?.abort();
    setProgress(null);
    setError("");
    setComplete(false);
    setExportedBlob(null);
    onClose();
  };

  const isRunning = Boolean(progress && !complete && !error);
  return (
    <div className="dialog-backdrop">
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header>
          <div>
            <span className="dialog-kicker">Local render</span>
            <h2 id="export-title">{complete ? "Your video is ready" : "Export Vibe Screen video"}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close export">
            <X size={18} />
          </button>
        </header>
        {complete ? (
          <div className="export-complete">
            <CheckCircle size={42} weight="duotone" />
            <strong>Export completed</strong>
            <p>The encoded file was saved without uploading your project.</p>
            <button
              className="primary-button"
              disabled={!exportedBlob}
              onClick={() => exportedBlob && void saveBlob(exportedBlob, state.project.name)}
            >
              <Export size={17} />
              Save another copy
            </button>
          </div>
        ) : (
          <>
            <div className="export-specs">
              <div><span>Resolution</span><strong>{state.project.export.quality}</strong></div>
              <div><span>Frame rate</span><strong>{state.project.export.frameRate} fps</strong></div>
              <div><span>Bitrate</span><strong>{Math.round(state.project.export.videoBitrate / 1_000_000)} Mbps</strong></div>
            </div>
            {progress && (
              <div className="export-progress">
                <div><span>{progress.phase === "preparing" ? "Preparing media" : progress.phase === "finalizing" ? "Finalizing file" : "Rendering frames"}</span><strong>{Math.round(progress.progress * 100)}%</strong></div>
                <progress max="1" value={progress.progress} />
                <small>{formatTime(progress.elapsed)} / {formatTime(progress.total)}</small>
              </div>
            )}
            {error && <p className="inline-error">{error}</p>}
            <button className="primary-button export-confirm" onClick={() => void start()} disabled={isRunning}>
              <Export size={17} />
              {isRunning ? "Rendering..." : error ? "Try export again" : "Start export"}
            </button>
            <p className="privacy-note">Keep this tab active during the real-time render.</p>
          </>
        )}
      </section>
    </div>
  );
}
