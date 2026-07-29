import {
  createEmptyProject,
  createId,
  type MediaAsset,
  type TextOverlay,
  touchProject,
  type VibeProject,
  type ZoomRegion,
} from "./project";

export interface EditorState {
  project: VibeProject;
  selectedId: string | null;
  currentTime: number;
  isPlaying: boolean;
  activePanel: "media" | "canvas" | "text" | "zoom" | "export";
  past: VibeProject[];
  future: VibeProject[];
}

export type EditorAction =
  | { type: "SET_PROJECT"; project: VibeProject }
  | { type: "SET_NAME"; name: string }
  | { type: "ADD_ASSET"; asset: MediaAsset; makePrimary?: boolean }
  | { type: "REMOVE_ASSET"; assetId: string }
  | { type: "UPDATE_APPEARANCE"; patch: Partial<VibeProject["appearance"]> }
  | { type: "UPDATE_WEBCAM"; patch: Partial<VibeProject["webcam"]> }
  | { type: "UPDATE_EXPORT"; patch: Partial<VibeProject["export"]> }
  | { type: "SET_TRIM"; start: number; end: number }
  | { type: "ADD_TEXT"; overlay?: Partial<TextOverlay> }
  | { type: "UPDATE_TEXT"; id: string; patch: Partial<TextOverlay> }
  | { type: "REMOVE_TEXT"; id: string }
  | { type: "ADD_ZOOM"; region?: Partial<ZoomRegion> }
  | { type: "UPDATE_ZOOM"; id: string; patch: Partial<ZoomRegion> }
  | { type: "REMOVE_ZOOM"; id: string }
  | { type: "SELECT"; id: string | null }
  | { type: "SEEK"; time: number }
  | { type: "SET_PLAYING"; value: boolean }
  | { type: "SET_PANEL"; panel: EditorState["activePanel"] }
  | { type: "UNDO" }
  | { type: "REDO" };

export function createEditorState(project = createEmptyProject()): EditorState {
  return {
    project,
    selectedId: null,
    currentTime: 0,
    isPlaying: false,
    activePanel: "media",
    past: [],
    future: [],
  };
}

function commit(state: EditorState, project: VibeProject): EditorState {
  return {
    ...state,
    project: touchProject(project),
    past: [...state.past.slice(-49), state.project],
    future: [],
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_PROJECT":
      return createEditorState(action.project);
    case "SET_NAME":
      return commit(state, { ...state.project, name: action.name.slice(0, 120) });
    case "ADD_ASSET": {
      const isPrimary = action.makePrimary || !state.project.screenAssetId;
      const webcamAssetId =
        action.asset.kind === "camera" ? action.asset.id : state.project.webcam.assetId;
      return commit(state, {
        ...state.project,
        assets: [...state.project.assets, action.asset],
        screenAssetId: isPrimary ? action.asset.id : state.project.screenAssetId,
        trim: isPrimary
          ? { start: 0, end: action.asset.duration }
          : state.project.trim,
        webcam: {
          ...state.project.webcam,
          assetId: webcamAssetId,
          enabled: Boolean(webcamAssetId),
        },
      });
    }
    case "REMOVE_ASSET": {
      const assets = state.project.assets.filter((asset) => asset.id !== action.assetId);
      const screenAssetId =
        state.project.screenAssetId === action.assetId
          ? (assets.find((asset) => asset.kind !== "camera")?.id ?? null)
          : state.project.screenAssetId;
      return commit(state, {
        ...state.project,
        assets,
        screenAssetId,
        webcam: {
          ...state.project.webcam,
          assetId:
            state.project.webcam.assetId === action.assetId
              ? null
              : state.project.webcam.assetId,
          enabled:
            state.project.webcam.assetId === action.assetId
              ? false
              : state.project.webcam.enabled,
        },
      });
    }
    case "UPDATE_APPEARANCE":
      return commit(state, {
        ...state.project,
        appearance: { ...state.project.appearance, ...action.patch },
      });
    case "UPDATE_WEBCAM":
      return commit(state, {
        ...state.project,
        webcam: { ...state.project.webcam, ...action.patch },
      });
    case "UPDATE_EXPORT":
      return commit(state, {
        ...state.project,
        export: { ...state.project.export, ...action.patch },
      });
    case "SET_TRIM":
      return commit(state, {
        ...state.project,
        trim: { start: action.start, end: action.end },
      });
    case "ADD_TEXT": {
      const duration = Math.max(state.project.trim.end, 3);
      const overlay: TextOverlay = {
        id: createId("text"),
        text: "Add your message",
        start: state.currentTime,
        end: Math.min(state.currentTime + 3, duration),
        x: 50,
        y: 14,
        width: 60,
        fontSize: 48,
        fontWeight: 700,
        color: "#f8f7fb",
        background: "rgba(28, 24, 38, 0.72)",
        align: "center",
        ...action.overlay,
      };
      return {
        ...commit(state, {
          ...state.project,
          textOverlays: [...state.project.textOverlays, overlay],
        }),
        selectedId: overlay.id,
        activePanel: "text",
      };
    }
    case "UPDATE_TEXT":
      return commit(state, {
        ...state.project,
        textOverlays: state.project.textOverlays.map((overlay) =>
          overlay.id === action.id ? { ...overlay, ...action.patch } : overlay,
        ),
      });
    case "REMOVE_TEXT":
      return {
        ...commit(state, {
          ...state.project,
          textOverlays: state.project.textOverlays.filter((overlay) => overlay.id !== action.id),
        }),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "ADD_ZOOM": {
      const duration = Math.max(state.project.trim.end, 3);
      const region: ZoomRegion = {
        id: createId("zoom"),
        start: state.currentTime,
        end: Math.min(state.currentTime + 2, duration),
        scale: 1.5,
        x: 50,
        y: 50,
        ...action.region,
      };
      return {
        ...commit(state, {
          ...state.project,
          zoomRegions: [...state.project.zoomRegions, region],
        }),
        selectedId: region.id,
        activePanel: "zoom",
      };
    }
    case "UPDATE_ZOOM":
      return commit(state, {
        ...state.project,
        zoomRegions: state.project.zoomRegions.map((region) =>
          region.id === action.id ? { ...region, ...action.patch } : region,
        ),
      });
    case "REMOVE_ZOOM":
      return {
        ...commit(state, {
          ...state.project,
          zoomRegions: state.project.zoomRegions.filter((region) => region.id !== action.id),
        }),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "SELECT":
      return { ...state, selectedId: action.id };
    case "SEEK":
      return { ...state, currentTime: action.time };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.value };
    case "SET_PANEL":
      return { ...state, activePanel: action.panel };
    case "UNDO": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        project: previous,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, 50),
      };
    }
    case "REDO": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        project: next,
        past: [...state.past, state.project].slice(-50),
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}
