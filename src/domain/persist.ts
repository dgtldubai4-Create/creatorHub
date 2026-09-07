import type { AppState } from "./types";
import { createSeed, SEED_VERSION } from "./seed";

export const STORAGE_KEY = "dabur-squad:state";

interface Envelope {
  marker: "dabur-squad";
  seedVersion: string;
  savedAt: string;
  state: AppState;
}

function looksLikeState(x: unknown): x is AppState {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return Array.isArray(s.creators) && Array.isArray(s.campaigns) && Array.isArray(s.participations) && typeof s.seedVersion === "string" && !!s.session;
}

/** Rehydrate from browser storage, or fall back to a fresh seed when the payload is missing, stale or corrupt. */
export function loadState(): { state: AppState; source: "storage" | "seed" } {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { state: createSeed(), source: "seed" };
    const env = JSON.parse(raw) as Partial<Envelope>;
    if (env.marker !== "dabur-squad" || env.seedVersion !== SEED_VERSION || !looksLikeState(env.state)) {
      return { state: createSeed(), source: "seed" };
    }
    const { lastError: _drop, ...clean } = env.state;
    void _drop;
    return { state: clean as AppState, source: "storage" };
  } catch {
    return { state: createSeed(), source: "seed" };
  }
}

export function saveState(state: AppState): void {
  try {
    const { lastError: _drop, ...clean } = state;
    void _drop;
    const env: Envelope = { marker: "dabur-squad", seedVersion: SEED_VERSION, savedAt: new Date().toISOString(), state: clean as AppState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch {
    // Storage full or unavailable: the in-memory state still works for this session.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
