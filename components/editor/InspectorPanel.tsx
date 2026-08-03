"use client";

import {
  ArrowsOutCardinal,
  Export,
  FilmSlate,
  ImageSquare,
  MagnifyingGlassPlus,
  TextT,
  Trash,
} from "@phosphor-icons/react";
import { clampTime, getScreenAsset, type AspectRatio } from "@/lib/project";
import { useEditor } from "./EditorContext";
import { useEditorCopy } from "./EditorI18n";

const panels = [
  { id: "media" as const, icon: FilmSlate },
  { id: "canvas" as const, icon: ImageSquare },
  { id: "text" as const, icon: TextT },
  { id: "zoom" as const, icon: MagnifyingGlassPlus },
  { id: "export" as const, icon: Export },
];

export function InspectorPanel({ onExport }: { onExport: () => void }) {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  return (
    <aside className="inspector-panel" aria-label={copy.inspector.aria}>
      <nav aria-label={copy.inspector.sections}>
        {panels.map(({ id, icon: Icon }) => (
          <button
            key={id}
            className={state.activePanel === id ? "active" : ""}
            onClick={() => dispatch({ type: "SET_PANEL", panel: id })}
          >
            <Icon size={17} />
            <span>{copy.inspector.panel[id]}</span>
          </button>
        ))}
      </nav>
      <div className="inspector-content">
        {state.activePanel === "media" && <ClipInspector />}
        {state.activePanel === "canvas" && <CanvasInspector />}
        {state.activePanel === "text" && <TextInspector />}
        {state.activePanel === "zoom" && <ZoomInspector />}
        {state.activePanel === "export" && <ExportInspector onExport={onExport} />}
      </div>
    </aside>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="inspector-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function ClipInspector() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const asset = getScreenAsset(state.project);
  if (!asset) {
    return <InspectorEmpty icon={<FilmSlate size={25} />} title={copy.inspector.clip.noSelectedTitle} body={copy.inspector.clip.noSelectedBody} />;
  }
  const start = state.project.trim.start;
  const end = state.project.trim.end || asset.duration;
  return (
    <>
      <SectionHeader title={copy.inspector.clip.title} description={copy.inspector.clip.description} />
      <div className="source-summary">
        <video src={asset.objectUrl} muted preload="metadata" />
        <div>
          <strong>{asset.name}</strong>
          <span>{asset.width} × {asset.height}</span>
        </div>
      </div>
      <ControlGroup label={copy.inspector.clip.trim}>
        <div className="dual-values">
          <NumberField
            label={copy.inspector.clip.in}
            value={start}
            max={Math.max(0, end - 0.1)}
            step={0.1}
            onChange={(value) =>
              dispatch({ type: "SET_TRIM", start: clampTime(value, end - 0.1), end })
            }
          />
          <NumberField
            label={copy.inspector.clip.out}
            value={end}
            min={start + 0.1}
            max={asset.duration}
            step={0.1}
            onChange={(value) =>
              dispatch({
                type: "SET_TRIM",
                start,
                end: Math.max(start + 0.1, clampTime(value, asset.duration)),
              })
            }
          />
        </div>
        <input
          aria-label={copy.inspector.clip.trimIn}
          type="range"
          min="0"
          max={asset.duration}
          step="0.05"
          value={start}
          onChange={(event) =>
            dispatch({
              type: "SET_TRIM",
              start: Math.min(Number(event.target.value), end - 0.1),
              end,
            })
          }
        />
        <input
          aria-label={copy.inspector.clip.trimOut}
          type="range"
          min="0"
          max={asset.duration}
          step="0.05"
          value={end}
          onChange={(event) =>
            dispatch({
              type: "SET_TRIM",
              start,
              end: Math.max(Number(event.target.value), start + 0.1),
            })
          }
        />
      </ControlGroup>
      {state.project.webcam.assetId && (
        <ControlGroup label={copy.inspector.clip.camera}>
          <Toggle
            label={copy.inspector.clip.showCamera}
            checked={state.project.webcam.enabled}
            onChange={(enabled) => dispatch({ type: "UPDATE_WEBCAM", patch: { enabled } })}
          />
          <Range
            label={copy.inspector.clip.size}
            value={state.project.webcam.size}
            min={10}
            max={42}
            unit="%"
            onChange={(size) => dispatch({ type: "UPDATE_WEBCAM", patch: { size } })}
          />
          <div className="dual-values">
            <NumberField label={copy.inspector.clip.x} value={state.project.webcam.x} min={0} max={100} onChange={(x) => dispatch({ type: "UPDATE_WEBCAM", patch: { x } })} />
            <NumberField label={copy.inspector.clip.y} value={state.project.webcam.y} min={0} max={100} onChange={(y) => dispatch({ type: "UPDATE_WEBCAM", patch: { y } })} />
          </div>
          <SelectField
            label={copy.inspector.clip.shape}
            value={state.project.webcam.shape}
            options={[
              ["circle", copy.inspector.clip.circle],
              ["rounded", copy.inspector.clip.rounded],
              ["square", copy.inspector.clip.square],
            ]}
            onChange={(shape) =>
              dispatch({
                type: "UPDATE_WEBCAM",
                patch: { shape: shape as "circle" | "rounded" | "square" },
              })
            }
          />
          <Toggle label={copy.inspector.clip.mirror} checked={state.project.webcam.mirrored} onChange={(mirrored) => dispatch({ type: "UPDATE_WEBCAM", patch: { mirrored } })} />
        </ControlGroup>
      )}
    </>
  );
}

function CanvasInspector() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const appearance = state.project.appearance;
  const ratios: Array<[AspectRatio, string]> = [
    ["source", copy.inspector.canvasPanel.original],
    ["16:9", copy.inspector.canvasPanel.wide],
    ["9:16", copy.inspector.canvasPanel.vertical],
    ["1:1", copy.inspector.canvasPanel.square],
    ["4:3", copy.inspector.canvasPanel.classic],
  ];
  return (
    <>
      <SectionHeader title={copy.inspector.canvasPanel.title} description={copy.inspector.canvasPanel.description} />
      <ControlGroup label={copy.inspector.canvasPanel.ratio}>
        <div className="ratio-grid">
          {ratios.map(([value, label]) => (
            <button
              key={value}
              className={appearance.aspectRatio === value ? "active" : ""}
              onClick={() => dispatch({ type: "UPDATE_APPEARANCE", patch: { aspectRatio: value } })}
            >
              <i className={`ratio-${value.replace(":", "-")}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </ControlGroup>
      <ControlGroup label={copy.inspector.canvasPanel.background}>
        <div className="segmented-control">
          {(["solid", "gradient"] as const).map((kind) => (
            <button
              key={kind}
              className={appearance.backgroundKind === kind ? "active" : ""}
              onClick={() => dispatch({ type: "UPDATE_APPEARANCE", patch: { backgroundKind: kind } })}
            >
              {kind === "solid" ? copy.inspector.canvasPanel.solid : copy.inspector.canvasPanel.gradient}
            </button>
          ))}
        </div>
        {appearance.backgroundKind === "solid" ? (
          <ColorField
            label={copy.inspector.canvasPanel.color}
            value={appearance.background}
            onChange={(background) => dispatch({ type: "UPDATE_APPEARANCE", patch: { background } })}
          />
        ) : (
          <>
            <div className="dual-values">
              <ColorField
                label={copy.inspector.canvasPanel.from}
                value={appearance.gradientFrom}
                onChange={(gradientFrom) => dispatch({ type: "UPDATE_APPEARANCE", patch: { gradientFrom } })}
              />
              <ColorField
                label={copy.inspector.canvasPanel.to}
                value={appearance.gradientTo}
                onChange={(gradientTo) => dispatch({ type: "UPDATE_APPEARANCE", patch: { gradientTo } })}
              />
            </div>
            <Range label={copy.inspector.canvasPanel.angle} value={appearance.gradientAngle} min={0} max={360} unit="°" onChange={(gradientAngle) => dispatch({ type: "UPDATE_APPEARANCE", patch: { gradientAngle } })} />
          </>
        )}
      </ControlGroup>
      <ControlGroup label={copy.inspector.canvasPanel.frame}>
        <Range label={copy.inspector.canvasPanel.padding} value={appearance.padding} min={0} max={18} unit="%" onChange={(padding) => dispatch({ type: "UPDATE_APPEARANCE", patch: { padding } })} />
        <Range label={copy.inspector.canvasPanel.radius} value={appearance.radius} min={0} max={60} unit="%" onChange={(radius) => dispatch({ type: "UPDATE_APPEARANCE", patch: { radius } })} />
        <Range label={copy.inspector.canvasPanel.shadow} value={appearance.shadow} min={0} max={100} unit="%" onChange={(shadow) => dispatch({ type: "UPDATE_APPEARANCE", patch: { shadow } })} />
      </ControlGroup>
    </>
  );
}

function TextInspector() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const overlay = state.project.textOverlays.find((item) => item.id === state.selectedId);
  if (!overlay) {
    return (
      <>
        <SectionHeader title={copy.inspector.textPanel.title} description={copy.inspector.textPanel.description} />
        <InspectorEmpty icon={<TextT size={25} />} title={copy.inspector.textPanel.noSelectedTitle} body={copy.inspector.textPanel.noSelectedBody} action={<button className="primary-button" onClick={() => dispatch({ type: "ADD_TEXT" })}>{copy.inspector.textPanel.add}</button>} />
      </>
    );
  }
  return (
    <>
      <SectionHeader title={copy.inspector.textPanel.layerTitle} description={copy.inspector.textPanel.layerDescription} />
      <ControlGroup label={copy.inspector.textPanel.content}>
        <label className="stacked-field">
          <span>{copy.inspector.textPanel.text}</span>
          <textarea value={overlay.text} rows={4} onChange={(event) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { text: event.target.value.slice(0, 240) } })} />
        </label>
      </ControlGroup>
      <ControlGroup label={copy.inspector.textPanel.timing}>
        <div className="dual-values">
          <NumberField label={copy.inspector.textPanel.start} value={overlay.start} min={0} max={overlay.end - 0.1} step={0.1} onChange={(start) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { start } })} />
          <NumberField label={copy.inspector.textPanel.end} value={overlay.end} min={overlay.start + 0.1} max={state.project.trim.end} step={0.1} onChange={(end) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { end } })} />
        </div>
      </ControlGroup>
      <ControlGroup label={copy.inspector.textPanel.typography}>
        <Range label={copy.inspector.textPanel.size} value={overlay.fontSize} min={18} max={120} unit="px" onChange={(fontSize) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { fontSize } })} />
        <Range label={copy.inspector.textPanel.weight} value={overlay.fontWeight} min={400} max={900} step={100} onChange={(fontWeight) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { fontWeight } })} />
        <ColorField label={copy.inspector.textPanel.color} value={overlay.color} onChange={(color) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { color } })} />
      </ControlGroup>
      <ControlGroup label={copy.inspector.textPanel.position}>
        <div className="dual-values">
          <NumberField label={copy.inspector.textPanel.x} value={overlay.x} min={0} max={100} onChange={(x) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { x } })} />
          <NumberField label={copy.inspector.textPanel.y} value={overlay.y} min={0} max={100} onChange={(y) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { y } })} />
        </div>
        <Range label={copy.inspector.textPanel.width} value={overlay.width} min={20} max={96} unit="%" onChange={(width) => dispatch({ type: "UPDATE_TEXT", id: overlay.id, patch: { width } })} />
      </ControlGroup>
      <button className="delete-button" onClick={() => dispatch({ type: "REMOVE_TEXT", id: overlay.id })}>
        <Trash size={16} />
        {copy.inspector.textPanel.remove}
      </button>
    </>
  );
}

function ZoomInspector() {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const region = state.project.zoomRegions.find((item) => item.id === state.selectedId);
  if (!region) {
    return (
      <>
        <SectionHeader title={copy.inspector.zoomPanel.title} description={copy.inspector.zoomPanel.description} />
        <InspectorEmpty icon={<MagnifyingGlassPlus size={25} />} title={copy.inspector.zoomPanel.noSelectedTitle} body={copy.inspector.zoomPanel.noSelectedBody} action={<button className="primary-button" onClick={() => dispatch({ type: "ADD_ZOOM" })}>{copy.inspector.zoomPanel.add}</button>} />
      </>
    );
  }
  return (
    <>
      <SectionHeader title={copy.inspector.zoomPanel.regionTitle} description={copy.inspector.zoomPanel.regionDescription} />
      <ControlGroup label={copy.inspector.zoomPanel.timing}>
        <div className="dual-values">
          <NumberField label={copy.inspector.zoomPanel.start} value={region.start} min={0} max={region.end - 0.1} step={0.1} onChange={(start) => dispatch({ type: "UPDATE_ZOOM", id: region.id, patch: { start } })} />
          <NumberField label={copy.inspector.zoomPanel.end} value={region.end} min={region.start + 0.1} max={state.project.trim.end} step={0.1} onChange={(end) => dispatch({ type: "UPDATE_ZOOM", id: region.id, patch: { end } })} />
        </div>
      </ControlGroup>
      <ControlGroup label={copy.inspector.zoomPanel.focus}>
        <Range label={copy.inspector.zoomPanel.scale} value={region.scale} min={1} max={3} step={0.05} unit="×" onChange={(scale) => dispatch({ type: "UPDATE_ZOOM", id: region.id, patch: { scale } })} />
        <div className="dual-values">
          <NumberField label={copy.inspector.zoomPanel.x} value={region.x} min={0} max={100} onChange={(x) => dispatch({ type: "UPDATE_ZOOM", id: region.id, patch: { x } })} />
          <NumberField label={copy.inspector.zoomPanel.y} value={region.y} min={0} max={100} onChange={(y) => dispatch({ type: "UPDATE_ZOOM", id: region.id, patch: { y } })} />
        </div>
      </ControlGroup>
      <button className="delete-button" onClick={() => dispatch({ type: "REMOVE_ZOOM", id: region.id })}>
        <Trash size={16} />
        {copy.inspector.zoomPanel.remove}
      </button>
    </>
  );
}

function ExportInspector({ onExport }: { onExport: () => void }) {
  const { state, dispatch } = useEditor();
  const copy = useEditorCopy();
  const asset = getScreenAsset(state.project);
  return (
    <>
      <SectionHeader title={copy.inspector.exportPanel.title} description={copy.inspector.exportPanel.description} />
      <ControlGroup label={copy.inspector.exportPanel.output}>
        <SelectField
          label={copy.inspector.exportPanel.resolution}
          value={state.project.export.quality}
          options={[
            ["720p", "720p"],
            ["1080p", "1080p"],
            ["1440p", "1440p"],
            ["2160p", copy.inspector.exportPanel.fourK],
            ["source", copy.inspector.exportPanel.source],
          ]}
          onChange={(quality) => dispatch({ type: "UPDATE_EXPORT", patch: { quality: quality as typeof state.project.export.quality } })}
        />
        <div className="segmented-control">
          {[30, 60].map((frameRate) => (
            <button key={frameRate} className={state.project.export.frameRate === frameRate ? "active" : ""} onClick={() => dispatch({ type: "UPDATE_EXPORT", patch: { frameRate: frameRate as 30 | 60 } })}>
              {frameRate} fps
            </button>
          ))}
        </div>
        <Range label={copy.inspector.exportPanel.bitrate} value={state.project.export.videoBitrate / 1_000_000} min={6} max={60} step={1} unit=" Mbps" onChange={(videoBitrate) => dispatch({ type: "UPDATE_EXPORT", patch: { videoBitrate: videoBitrate * 1_000_000 } })} />
      </ControlGroup>
      <div className="export-summary">
        <ArrowsOutCardinal size={20} />
        <div>
          <strong>{state.project.export.quality === "source" ? `${asset?.width ?? 0} × ${asset?.height ?? 0}` : state.project.export.quality}</strong>
          <span>{state.project.export.frameRate} fps · {copy.inspector.exportPanel.localRender}</span>
        </div>
      </div>
      <button className="primary-button inspector-export" onClick={onExport} disabled={!asset}>
        <Export size={17} />
        {copy.inspector.exportPanel.exportVideo}
      </button>
      <p className="export-note">{copy.inspector.exportPanel.note}</p>
    </>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="control-group">
      <h3>{label}</h3>
      {children}
    </section>
  );
}

function Range({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  return (
    <label className="range-control">
      <span><b>{label}</b><output>{Number(value.toFixed(2))}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function NumberField({ label, value, min = 0, max = 100, step = 1, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input type="number" value={Number(value.toFixed(2))} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <i style={{ background: value }}><input type="color" value={value.startsWith("#") ? value : "#6650a4"} onChange={(event) => onChange(event.target.value)} /></i>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="stacked-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([option, title]) => <option key={option} value={option}>{title}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="simple-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function InspectorEmpty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="inspector-empty">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}
