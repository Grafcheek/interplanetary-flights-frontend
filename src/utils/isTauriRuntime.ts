export function isTauriRuntime(): boolean {
  if (import.meta.env.MODE === "tauri") return true;
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}
