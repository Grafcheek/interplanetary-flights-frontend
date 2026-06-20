import { useEffect, useState } from "react";
import { CreateMLCEngine, type InitProgressReport, type MLCEngine } from "@mlc-ai/web-llm";
import { formatWebLlmError } from "../../modules/llm/webLlmSupport";

/** Меньшая модель — быстрее скачивается, меньше VRAM. */
const DEFAULT_MODEL = "Qwen2-0.5B-Instruct-q4f16_1-MLC";

const useWebLLM = (enabled: boolean, model: string = DEFAULT_MODEL) => {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const initEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(0);

        const engineInstance = await CreateMLCEngine(model, {
          initProgressCallback: (report: InitProgressReport) => {
            if (!cancelled) setProgress(report.progress);
          },
        });

        if (!cancelled) setEngine(engineInstance);
      } catch (err) {
        if (cancelled) return;
        console.error("WebLLM init error:", err);
        setError(formatWebLlmError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initEngine();

    return () => {
      cancelled = true;
    };
  }, [enabled, model]);

  return { engine, progress, error, isLoading };
};

export default useWebLLM;
