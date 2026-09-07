import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastViewport, type ToastItem, type ToastKind } from "./primitives";

type Push = (text: string, kind?: ToastKind) => void;
const Ctx = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback<Push>((text, kind = "info") => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-2), { id, kind, text }]);
    window.setTimeout(() => dismiss(id), kind === "error" ? 5200 : 3600);
  }, [dismiss]);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast(): Push {
  return useContext(Ctx);
}
