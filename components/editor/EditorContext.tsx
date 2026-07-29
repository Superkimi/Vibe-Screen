"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createMediaAsset } from "@/lib/media";
import {
  createEditorState,
  editorReducer,
  type EditorAction,
  type EditorState,
} from "@/lib/editor-state";
import { createEmptyProject, type AssetKind, type MediaAsset } from "@/lib/project";
import { getLastProjectId, loadProject, saveProject } from "@/lib/project-storage";

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  blobs: React.MutableRefObject<Map<string, Blob>>;
  hydrated: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  addBlob: (blob: Blob, name: string, kind: AssetKind, makePrimary?: boolean) => Promise<MediaAsset>;
  newProject: () => void;
  saveNow: () => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createEditorState());
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<EditorContextValue["saveState"]>("idle");
  const blobs = useRef(new Map<string, Blob>());
  const projectRef = useRef(state.project);

  useEffect(() => {
    projectRef.current = state.project;
  }, [state.project]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const projectId = getLastProjectId();
      if (!projectId) {
        setHydrated(true);
        return;
      }
      try {
        const saved = await loadProject(projectId);
        if (!saved || cancelled) return;
        blobs.current = saved.blobs;
        dispatch({ type: "SET_PROJECT", project: saved.project });
      } catch {
        // A corrupt local draft should never block the editor from opening.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveNow = useCallback(async () => {
    if (!hydrated) return;
    setSaveState("saving");
    try {
      await saveProject(projectRef.current, blobs.current);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => void saveNow(), 1_100);
    return () => window.clearTimeout(timeout);
  }, [hydrated, saveNow, state.project]);

  const addBlob = useCallback(
    async (blob: Blob, name: string, kind: AssetKind, makePrimary = false) => {
      const asset = await createMediaAsset(blob, name, kind);
      blobs.current.set(asset.id, blob);
      dispatch({ type: "ADD_ASSET", asset, makePrimary });
      return asset;
    },
    [],
  );

  const newProject = useCallback(() => {
    for (const asset of projectRef.current.assets) {
      if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    }
    blobs.current = new Map();
    dispatch({ type: "SET_PROJECT", project: createEmptyProject() });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      blobs,
      hydrated,
      saveState,
      addBlob,
      newProject,
      saveNow,
    }),
    [state, hydrated, saveState, addBlob, newProject, saveNow],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor must be used within EditorProvider.");
  return value;
}
