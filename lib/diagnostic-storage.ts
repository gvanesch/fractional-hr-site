import type { SavedDiagnosticState } from "./diagnostic";

export const DIAGNOSTIC_STORAGE_KEY = "greg-diagnostic-v1";

export function saveDiagnosticState(state: SavedDiagnosticState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(state));
}

export function loadDiagnosticState(): SavedDiagnosticState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SavedDiagnosticState;
  } catch {
    return null;
  }
}

export function clearDiagnosticState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DIAGNOSTIC_STORAGE_KEY);
}