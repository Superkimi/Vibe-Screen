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
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { useEditor } from "./EditorContext";
import { useEditorCopy, useEditorLocale } from "./EditorI18n";
import { RecorderDialog } from "./RecorderDialog";

export function TopToolbar({ onExport }: { onExport: () => void }) {
  const { state, dispatch, saveState } = useEditor();
  const copy = useEditorCopy();
  const locale = useEditorLocale();
  const [recorderOpen, setRecorderOpen] = useState(false);
  return (
    <>
      <header className="editor-topbar">
        <div className="topbar-brand">
          <Link href={`/${locale}`} aria-label={copy.toolbar.backHome}>
            <ArrowLeft size={17} />
          </Link>
          <span className="brand-mark">V</span>
          <input
            aria-label={copy.toolbar.projectName}
            value={state.project.name}
            onChange={(event) => dispatch({ type: "SET_NAME", name: event.target.value })}
          />
        </div>
        <div className="history-controls">
          <button
            className="icon-button"
            aria-label={copy.toolbar.undo}
            disabled={state.past.length === 0}
            onClick={() => dispatch({ type: "UNDO" })}
          >
            <ArrowCounterClockwise size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={copy.toolbar.redo}
            disabled={state.future.length === 0}
            onClick={() => dispatch({ type: "REDO" })}
          >
            <ArrowUUpRight size={18} />
          </button>
          <span className={`save-indicator ${saveState}`}>
            {saveState === "error" ? <CloudSlash size={16} /> : <CloudCheck size={16} />}
            {saveState === "saving"
              ? copy.toolbar.saving
              : saveState === "error"
                ? copy.toolbar.saveFailed
                : copy.toolbar.saved}
          </span>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher
            locale={locale}
            ariaLabel={copy.toolbar.language}
            pathForLocale={(nextLocale) => `/${nextLocale}/studio`}
          />
          <button className="secondary-button" onClick={() => setRecorderOpen(true)}>
            <Record size={17} weight="fill" />
            {copy.toolbar.record}
          </button>
          <button className="primary-button" onClick={onExport}>
            <Export size={17} />
            {copy.toolbar.export}
          </button>
        </div>
      </header>
      <RecorderDialog open={recorderOpen} onClose={() => setRecorderOpen(false)} />
    </>
  );
}
