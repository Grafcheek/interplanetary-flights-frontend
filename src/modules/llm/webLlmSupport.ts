type GpuLike = {
  requestAdapter(options?: {
    powerPreference?: "low-power" | "high-performance";
    forceFallbackAdapter?: boolean;
  }): Promise<GpuAdapterLike | null>;
};

type GpuAdapterLike = {
  info?: Promise<{ description?: string; device?: string; vendor?: string }>;
};

type GpuNavigator = Navigator & { gpu?: GpuLike };

export type WebLlmDebugInfo = {
  webGpu: boolean;
  crossOriginIsolated: boolean;
  adapterDefault: string | null;
  adapterFallback: string | null;
  userAgent: string;
};

async function describeAdapter(adapter: GpuAdapterLike | null): Promise<string | null> {
  if (!adapter) return null;
  try {
    const info = await adapter.info;
    return info?.description || info?.device || info?.vendor || "ok";
  } catch {
    return "ok";
  }
}

export async function getWebLlmDebugInfo(): Promise<WebLlmDebugInfo> {
  const webGpu = typeof navigator !== "undefined" && "gpu" in navigator;
  const crossOriginIsolated =
    typeof window !== "undefined" && window.crossOriginIsolated === true;

  let adapterDefault: string | null = null;
  let adapterFallback: string | null = null;

  if (webGpu) {
    try {
      const gpu = (navigator as GpuNavigator).gpu;
      adapterDefault = await describeAdapter(
        (await gpu?.requestAdapter({ powerPreference: "high-performance" })) ?? null,
      );
      adapterFallback = await describeAdapter(
        (await gpu?.requestAdapter({ forceFallbackAdapter: true })) ?? null,
      );
    } catch {
      // WebGPU probe failed — ignore, WebLLM will report its own error on load.
    }
  }

  return {
    webGpu,
    crossOriginIsolated,
    adapterDefault,
    adapterFallback,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

export function formatWebLlmError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/fetch|network|failed to fetch|Load model/i.test(message)) {
    return `Скачивание модели: ${message}`;
  }
  return message || "Ошибка WebLLM";
}

export function webLlmDebugLines(debug: WebLlmDebugInfo): string[] {
  return [
    `webGpu: ${debug.webGpu}`,
    `crossOriginIsolated: ${debug.crossOriginIsolated}`,
    `adapter: ${debug.adapterDefault ?? "null"}`,
    `adapterFallback: ${debug.adapterFallback ?? "null"}`,
    `ua: ${debug.userAgent}`,
  ];
}
