import { useEffect, useState } from "react";
import type { FC } from "react";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { Alert, Button } from "react-bootstrap";
import useWebLLM from "../../hooks/llm/useWebLLM";
import { PLANET_SEARCH_SYSTEM_PROMPT } from "../../modules/llm/planetSearchPrompt";
import { parsePlanetSearchJson, normalizePlanetSearchParams } from "../../modules/llm/planetSearchParams";
import { PLANETS_FILTERS_RESET_EVENT } from "../../modules/planetFiltersReset";
import { getWebLlmDebugInfo, type WebLlmDebugInfo, webLlmDebugLines } from "../../modules/llm/webLlmSupport";
import type { ChatMessage, PlanetSearchParams } from "../../types/llmTypes";
import InputArea from "./InputArea";
import ModelLoader from "./ModelLoader";
import "../../styles/llm.css";

interface PlanetLlmSearchPanelProps {
  onSearchParams: (params: PlanetSearchParams) => void;
}

const PlanetLlmSearchPanel: FC<PlanetLlmSearchPanelProps> = ({ onSearchParams }) => {
  const [modelEnabled, setModelEnabled] = useState(false);
  const [debug, setDebug] = useState<WebLlmDebugInfo | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const { engine, progress, error, isLoading: modelLoading } = useWebLLM(modelEnabled);

  useEffect(() => {
    const reset = () => {
      setInput("");
      setParseError(null);
      setDebug(null);
    };
    window.addEventListener(PLANETS_FILTERS_RESET_EVENT, reset);
    return () => window.removeEventListener(PLANETS_FILTERS_RESET_EVENT, reset);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !engine) return;

    const userText = input.trim();
    const newMessages: ChatMessage[] = [
      { role: "system", content: PLANET_SEARCH_SYSTEM_PROMPT },
      { role: "user", content: userText },
    ];

    setInput("");
    setLoading(true);
    setParseError(null);

    try {
      const reply = await engine.chat.completions.create({
        messages: newMessages as ChatCompletionMessageParam[],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 512,
      });

      const content = reply.choices[0]?.message?.content ?? "";
      const params = normalizePlanetSearchParams(parsePlanetSearchJson(content), userText);
      onSearchParams(params);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const showDebug = Boolean(error || parseError);
  const loadDebug = () => void getWebLlmDebugInfo().then(setDebug);

  return (
    <div className="llm-search-row">
      <div className="planet-filter-toolbar__row planet-filter-toolbar__row--text">
        {!modelEnabled ? (
          <Button
            type="button"
            className="search-btn llm-search-row__load-btn"
            onClick={() => setModelEnabled(true)}
          >
            Загрузить AI-модель
          </Button>
        ) : modelLoading ? (
          <ModelLoader progress={progress} />
        ) : error ? (
          <>
            <Alert variant="danger" className="mb-0 py-2 flex-grow-1">
              {error}
            </Alert>
            <Button
              type="button"
              className="search-btn search-btn--ghost llm-search-row__load-btn"
              onClick={() => {
                setModelEnabled(false);
                window.setTimeout(() => setModelEnabled(true), 0);
              }}
            >
              Повторить
            </Button>
          </>
        ) : (
          <InputArea
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={handleSend}
          />
        )}
      </div>

      {parseError && !error ? (
        <Alert variant="warning" className="mb-0 py-2">
          {parseError}
        </Alert>
      ) : null}

      {showDebug ? (
        <div className="llm-panel__debug">
          {!debug ? (
            <button type="button" className="llm-panel__debug-btn" onClick={loadDebug}>
              debug
            </button>
          ) : (
            <details open>
              <summary>debug</summary>
              <pre>{webLlmDebugLines(debug).join("\n")}</pre>
            </details>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PlanetLlmSearchPanel;
