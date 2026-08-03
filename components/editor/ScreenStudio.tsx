"use client";

import { useState } from "react";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { EditorProvider, useEditor } from "./EditorContext";
import { ExportDialog } from "./ExportDialog";
import { InspectorPanel } from "./InspectorPanel";
import { MediaRail } from "./MediaRail";
import { Timeline } from "./Timeline";
import { TopToolbar } from "./TopToolbar";
import { EditorI18nProvider, useEditorCopy } from "./EditorI18n";
import type { EditorLocale } from "@/lib/editor-copy";

export function ScreenStudio({ locale = "en" }: { locale?: EditorLocale }) {
  return (
    <EditorI18nProvider locale={locale}>
      <EditorProvider>
        <StudioShell />
      </EditorProvider>
    </EditorI18nProvider>
  );
}

function StudioShell() {
  const { hydrated } = useEditor();
  const copy = useEditorCopy();
  const [exportOpen, setExportOpen] = useState(false);
  if (!hydrated) {
    return (
      <main className="studio-loading">
        <span className="brand-mark">V</span>
        <div><i /><i /><i /></div>
        <p>{copy.loading}</p>
      </main>
    );
  }
  return (
    <div className="studio-shell">
      <TopToolbar onExport={() => setExportOpen(true)} />
      <div className="studio-main">
        <MediaRail />
        <CanvasWorkspace />
        <InspectorPanel onExport={() => setExportOpen(true)} />
      </div>
      <Timeline />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
