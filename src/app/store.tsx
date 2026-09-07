import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { AppState } from "../domain/types";
import { safeReducer, type Action } from "../domain/reducer";
import { clearState, loadState, saveState } from "../domain/persist";
import { createSeed } from "../domain/seed";

type Dispatch = (action: Action) => void;

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(safeReducer, undefined, () => loadState().state);
  const dispatch = useCallback<Dispatch>((action) => rawDispatch({ ...action, at: action.at ?? new Date().toISOString() }), []);

  // Persist on every change. The payload is small, so this stays synchronous and
  // nothing is lost if the tab closes right after an action.
  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useStore(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export function useDispatch(): Dispatch {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error("useDispatch outside StoreProvider");
  return d;
}

/** Wipes browser storage and reloads a fresh seed. */
export function useReset() {
  const dispatch = useDispatch();
  return useMemo(() => () => {
    clearState();
    dispatch({ type: "reset", state: createSeed() });
  }, [dispatch]);
}
