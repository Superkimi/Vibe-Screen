"use client";

import { CheckCircle, Export, X } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { exportProject, saveBlob, type ExportProgress } from "@/lib/exporter";
import { formatTime } from "@/lib/project";
import { useEditor } from "./EditorContext";
import { useEditorCopy } from "./EditorI18n";

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useEditor();
  const copy = useEditorCopy();
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
      setError(copy.exportDialog.error);
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
            <span className="dialog-kicker">{copy.exportDialog.kicker}</span>
            <h2 id="export-title">{complete ? copy.exportDialog.readyTitle : copy.exportDialog.title}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label={copy.exportDialog.close}>
            <X size={18} />
          </button>
        </header>
        {complete ? (
          <div className="export-complete">
            <CheckCircle size={42} weight="duotone" />
            <strong>{copy.exportDialog.completed}</strong>
            <p>{copy.exportDialog.completedBody}</p>
            <button
              className="primary-button"
              disabled={!exportedBlob}
              onClick={() => exportedBlob && void saveBlob(exportedBlob, state.project.name)}
            >
              <Export size={17} />
              {copy.exportDialog.saveAnother}
            </button>
          </div>
        ) : (
          <>
            <div className="export-specs">
              <div><span>{copy.exportDialog.resolution}</span><strong>{state.project.export.quality}</strong></div>
              <div><span>{copy.exportDialog.frameRate}</span><strong>{state.project.export.frameRate} fps</strong></div>
              <div><span>{copy.exportDialog.bitrate}</span><strong>{Math.round(state.project.export.videoBitrate / 1_000_000)} Mbps</strong></div>
            </div>
            {progress && (
              <div className="export-progress">
                <div><span>{progress.phase === "preparing" ? copy.exportDialog.preparing : progress.phase === "finalizing" ? copy.exportDialog.finalizing : copy.exportDialog.rendering}</span><strong>{Math.round(progress.progress * 100)}%</strong></div>
                <progress max="1" value={progress.progress} />
                <small>{formatTime(progress.elapsed)} / {formatTime(progress.total)}</small>
              </div>
            )}
            {error && <p className="inline-error">{error}</p>}
            <button className="primary-button export-confirm" onClick={() => void start()} disabled={isRunning}>
              <Export size={17} />
              {isRunning ? copy.exportDialog.renderingButton : error ? copy.exportDialog.retry : copy.exportDialog.start}
            </button>
            <p className="privacy-note">{copy.exportDialog.privacy}</p>
          </>
        )}
      </section>
    </div>
  );
}
