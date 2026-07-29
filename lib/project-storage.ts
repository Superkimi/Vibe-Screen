import { normalizeProject, type VibeProject } from "./project";

const DATABASE_NAME = "vibe-screen";
const DATABASE_VERSION = 1;
const PROJECT_STORE = "projects";
const BLOB_STORE = "blobs";
const LAST_PROJECT_KEY = "vibe-screen:last-project";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(BLOB_STORE)) {
        database.createObjectStore(BLOB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Storage transaction aborted."));
  });
}

export async function saveProject(project: VibeProject, blobs: Map<string, Blob>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([PROJECT_STORE, BLOB_STORE], "readwrite");
  const serializable = {
    ...project,
    assets: project.assets.map((asset) => {
      const persisted = { ...asset };
      delete persisted.objectUrl;
      return persisted;
    }),
  };
  transaction.objectStore(PROJECT_STORE).put(serializable);
  for (const asset of project.assets) {
    const blob = blobs.get(asset.id);
    if (blob) transaction.objectStore(BLOB_STORE).put(blob, asset.id);
  }
  await completeTransaction(transaction);
  database.close();
  localStorage.setItem(LAST_PROJECT_KEY, project.id);
}

export async function loadProject(projectId: string): Promise<{
  project: VibeProject;
  blobs: Map<string, Blob>;
} | null> {
  const database = await openDatabase();
  const transaction = database.transaction([PROJECT_STORE, BLOB_STORE], "readonly");
  const projectRequest = transaction.objectStore(PROJECT_STORE).get(projectId);
  const storedProject = await new Promise<unknown>((resolve, reject) => {
    projectRequest.onsuccess = () => resolve(projectRequest.result);
    projectRequest.onerror = () => reject(projectRequest.error);
  });
  if (!storedProject) {
    database.close();
    return null;
  }
  const project = normalizeProject(storedProject);
  const blobs = new Map<string, Blob>();
  await Promise.all(
    project.assets.map(
      (asset) =>
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(BLOB_STORE).get(asset.id);
          request.onsuccess = () => {
            if (request.result instanceof Blob) blobs.set(asset.id, request.result);
            resolve();
          };
          request.onerror = () => reject(request.error);
        }),
    ),
  );
  await completeTransaction(transaction);
  database.close();
  project.assets = project.assets.map((asset) => {
    const blob = blobs.get(asset.id);
    return blob ? { ...asset, objectUrl: URL.createObjectURL(blob) } : asset;
  });
  return { project, blobs };
}

export function getLastProjectId(): string | null {
  return typeof localStorage === "undefined" ? null : localStorage.getItem(LAST_PROJECT_KEY);
}

export async function deleteProject(projectId: string): Promise<void> {
  const loaded = await loadProject(projectId);
  const database = await openDatabase();
  const transaction = database.transaction([PROJECT_STORE, BLOB_STORE], "readwrite");
  transaction.objectStore(PROJECT_STORE).delete(projectId);
  loaded?.project.assets.forEach((asset) => transaction.objectStore(BLOB_STORE).delete(asset.id));
  await completeTransaction(transaction);
  database.close();
  if (localStorage.getItem(LAST_PROJECT_KEY) === projectId) {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
}
