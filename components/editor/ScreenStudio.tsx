"use client";

import { useState } from "react";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { EditorProvider, useEditor } from "./EditorContext";
import { ExportDialog } from "./ExportDialog";
import { InspectorPanel } from "./InspectorPanel";
import { MediaRail } from "./MediaRail";
import { Timeline } from "./Timeline";
import { TopToolbar } from "./TopToolbar";

export function ScreenStudio() {
  return (
    <EditorProvider>
      <StudioShell />
    </EditorProvider>
  );
}

function StudioShell() {
  const { hydrated } = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  if (!hydrated) {
    return (
      <main className="studio-loading">
        <span className="brand-mark">V</span>
        <div><i /><i /><i /></div>
        <p>Opening your local studio...</p>
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
