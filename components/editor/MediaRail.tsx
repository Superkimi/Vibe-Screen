"use client";

import {
  Camera,
  FilmStrip,
  FolderOpen,
  Plus,
  Record,
  Trash,
  VideoCamera,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { formatBytes, readVideoMetadata } from "@/lib/media";
import { formatTime } from "@/lib/project";
import { useEditor } from "./EditorContext";
import { RecorderDialog } from "./RecorderDialog";

export function MediaRail() {
  const { state, dispatch, addBlob, newProject } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("video/")) continue;
        await readVideoMetadata(file);
        await addBlob(file, file.name, "video", !state.project.screenAssetId);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The selected media could not be imported.");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <aside className="media-rail" aria-label="Project media">
        <header>
          <div>
            <span>Project</span>
            <strong>Media</strong>
          </div>
          <button className="icon-button" aria-label="New project" onClick={newProject}>
            <Plus size={17} />
          </button>
        </header>
        <div className="rail-actions">
          <button onClick={() => setRecordOpen(true)}>
            <Record size={18} weight="fill" />
            Record
          </button>
          <button onClick={() => inputRef.current?.click()}>
            <FolderOpen size={18} />
            Import
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            multiple
            hidden
            onChange={(event) => void importFiles(event.target.files)}
          />
        </div>
        <div className="media-section-title">
          <span>Assets</span>
          <b>{state.project.assets.length}</b>
        </div>
        <div className="media-list">
          {importing && (
            <div className="media-skeleton" aria-label="Importing media">
              <i />
              <span />
            </div>
          )}
          {state.project.assets.map((asset) => (
            <article
              key={asset.id}
              className={asset.id === state.project.screenAssetId ? "active" : ""}
            >
              <button
                className="media-select"
                onClick={() => {
                  if (asset.kind !== "camera") {
                    dispatch({
                      type: "SET_PROJECT",
                      project: {
                        ...state.project,
                        screenAssetId: asset.id,
                        trim: { start: 0, end: asset.duration },
                      },
                    });
                  } else {
                    dispatch({
                      type: "UPDATE_WEBCAM",
                      patch: { assetId: asset.id, enabled: true },
                    });
                  }
                }}
              >
                <span className="media-thumb">
                  {asset.objectUrl ? (
                    <video src={asset.objectUrl} muted preload="metadata" />
                  ) : asset.kind === "camera" ? (
                    <Camera size={20} />
                  ) : (
                    <FilmStrip size={20} />
                  )}
                  <small>{formatTime(asset.duration).slice(0, 5)}</small>
                </span>
                <span className="media-copy">
                  <strong>{asset.name}</strong>
                  <small>
                    {asset.width}×{asset.height} · {formatBytes(asset.size)}
                  </small>
                </span>
              </button>
              <button
                className="asset-delete"
                aria-label={`Remove ${asset.name}`}
                onClick={() => dispatch({ type: "REMOVE_ASSET", assetId: asset.id })}
              >
                <Trash size={14} />
              </button>
            </article>
          ))}
          {!importing && state.project.assets.length === 0 && (
            <div className="rail-empty">
              <VideoCamera size={28} />
              <strong>No media yet</strong>
              <p>Record your screen or import a browser-compatible video.</p>
            </div>
          )}
        </div>
        {error && <p className="rail-error">{error}</p>}
        <footer>
          <span>Local project</span>
          <small>Media never leaves this browser</small>
        </footer>
      </aside>
      <RecorderDialog open={recordOpen} onClose={() => setRecordOpen(false)} />
    </>
  );
}
