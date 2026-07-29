"use client";

import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowUUpRight,
  CloudCheck,
  CloudSlash,
  Export,
  Record,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useEditor } from "./EditorContext";
import { RecorderDialog } from "./RecorderDialog";

export function TopToolbar({ onExport }: { onExport: () => void }) {
  const { state, dispatch, saveState } = useEditor();
  const [recorderOpen, setRecorderOpen] = useState(false);
  return (
    <>
      <header className="editor-topbar">
        <div className="topbar-brand">
          <Link href="/" aria-label="Back to Vibe Screen home">
            <ArrowLeft size={17} />
          </Link>
          <span className="brand-mark">V</span>
          <input
            aria-label="Project name"
            value={state.project.name}
            onChange={(event) => dispatch({ type: "SET_NAME", name: event.target.value })}
          />
        </div>
        <div className="history-controls">
          <button
            className="icon-button"
            aria-label="Undo"
            disabled={state.past.length === 0}
            onClick={() => dispatch({ type: "UNDO" })}
          >
            <ArrowCounterClockwise size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            disabled={state.future.length === 0}
            onClick={() => dispatch({ type: "REDO" })}
          >
            <ArrowUUpRight size={18} />
          </button>
          <span className={`save-indicator ${saveState}`}>
            {saveState === "error" ? <CloudSlash size={16} /> : <CloudCheck size={16} />}
            {saveState === "saving"
              ? "Saving"
              : saveState === "error"
                ? "Local save failed"
                : "Saved locally"}
          </span>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" onClick={() => setRecorderOpen(true)}>
            <Record size={17} weight="fill" />
            Record
          </button>
          <button className="primary-button" onClick={onExport}>
            <Export size={17} />
            Export
          </button>
        </div>
      </header>
      <RecorderDialog open={recorderOpen} onClose={() => setRecorderOpen(false)} />
    </>
  );
}
