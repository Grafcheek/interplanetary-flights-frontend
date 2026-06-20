import * as tauriEnv from "../generated/tauriEnv";

export const API_BASE_URL =
  import.meta.env.MODE === "tauri" ? tauriEnv.API_BASE_URL : (import.meta.env.VITE_API_BASE_URL ?? "/api");

export const MINIO_BASE =
  import.meta.env.MODE === "tauri"
    ? tauriEnv.MINIO_BASE
    : import.meta.env.DEV
      ? "/minio"
      : ((import.meta.env.VITE_MINIO_BASE as string | undefined) ?? "http://localhost:9000");

export const BUILD_STAMP = import.meta.env.MODE === "tauri" ? tauriEnv.BUILD_STAMP : import.meta.env.MODE;
