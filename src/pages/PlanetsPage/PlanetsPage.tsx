import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import PlanetsList from "../../components/PlanetsList/PlanetsList";
import PlanetFilterBar from "../../components/PlanetFilterBar/PlanetFilterBar";
import CartRow from "../../components/CartRow/CartRow";
import type { PlanetJSON } from "../../cosmosApi";
import { planetClipDescription } from "../../cosmosApi";
import { filterMockPlanetsByQuery, PLANETS_MOCK } from "../../modules/mock";
import { listPlanetsAxios } from "../../modules/planetsApi";
import { usePlanetImageSearch } from "../../hooks/usePlanetImageSearch";

export default function PlanetsPage() {
  const [planets, setPlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [clipSourcePlanets, setClipSourcePlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const list = await listPlanetsAxios();
        if (cancelled) return;
        if (list.length > 0) {
          setPlanets(list);
          setClipSourcePlanets(list);
          setUseMock(false);
        } else {
          setPlanets(PLANETS_MOCK);
          setClipSourcePlanets(PLANETS_MOCK);
          setUseMock(true);
        }
      } catch {
        if (cancelled) return;
        setPlanets(PLANETS_MOCK);
        setClipSourcePlanets(PLANETS_MOCK);
        setUseMock(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const clipItems = useMemo(
    () =>
      clipSourcePlanets.map((p) => ({ id: p.planet_id, description: planetClipDescription(p) })),
    [clipSourcePlanets],
  );

  const {
    items: clipProcessed,
    ready: clipReady,
    progress: clipProgress,
    imageEmbedding,
    workerError,
    searchByImage,
    resetSearch,
  } = usePlanetImageSearch(clipItems, clipSessionActive);

  const planetById = useMemo(() => {
    const m = new Map<number, PlanetJSON>();
    clipSourcePlanets.forEach((p) => m.set(p.planet_id, p));
    return m;
  }, [clipSourcePlanets]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await listPlanetsAxios({ query });
      if (data.length > 0) {
        setPlanets(data);
        setClipSourcePlanets(data);
        setUseMock(false);
      } else if (useMock) {
        const filtered = filterMockPlanetsByQuery(query);
        setPlanets(filtered);
        setClipSourcePlanets(filtered);
      } else {
        setPlanets([]);
      }
    } catch {
      const filtered = filterMockPlanetsByQuery(query);
      setPlanets(filtered);
      setClipSourcePlanets(filtered);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadButtonClick = () => {
    if (!clipSessionActive) setClipSessionActive(true);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    resetSearch();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!clipReady || !selectedImageFile) return;
    searchByImage(selectedImageFile);
  }, [clipReady, searchByImage, selectedImageFile]);

  const imageSearchActive = Boolean(imageEmbedding);
  const visibleClipRows = useMemo(
    () => (imageSearchActive ? clipProcessed.filter((item) => item.isVisible) : []),
    [imageSearchActive, clipProcessed],
  );
  const showClipProgress = clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;
  const clipButtonLabel = showClipProgress
    ? `Загрузка модели... ${clipProgress}%`
    : "Поиск по изображению";

  const clipPlanets = useMemo(
    () =>
      visibleClipRows
        .map((item) => planetById.get(item.id))
        .filter((planet): planet is PlanetJSON => Boolean(planet)),
    [planetById, visibleClipRows],
  );

  const clipSimilarityById = useMemo(
    () => new Map(visibleClipRows.map((item) => [item.id, Number((item.score * 100).toFixed(1))])),
    [visibleClipRows],
  );

  return (
    <div className="planets-page">
      <div className="toolbar">
        <div className="toolbar-inner">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="clip-search-section__file-input"
            onChange={handleImageUpload}
          />
          <PlanetFilterBar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onImageUploadClick={handleUploadButtonClick}
            onClearImage={handleClearImage}
            clipButtonLabel={clipButtonLabel}
            disableClipSearch={clipItems.length === 0 || showClipProgress}
            disableClipReset={!selectedImageFile && !imageSearchActive}
          />
          <CartRow />
        </div>
      </div>
      <div className="space">
        <main className="planets-page__main">
          {workerError ? (
            <Alert variant="warning">Не удалось загрузить CLIP модель: {workerError}</Alert>
          ) : null}
          {loading ? (
            <div className="planets-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : imageSearchActive ? (
            <div className="planets-page__grid">
              {clipPlanets.length === 0 ? (
                <div className="planets-page__empty">
                  Нет подходящих перелетов выше порога. Попробуй другое изображение.
                </div>
              ) : (
                <PlanetsList planets={clipPlanets} similarityById={clipSimilarityById} />
              )}
            </div>
          ) : (
            <div className="planets-page__grid">
              {planets.length > 0 ? (
                <PlanetsList planets={planets} />
              ) : (
                <div className="planets-page__empty">
                  {query.trim()
                    ? `По запросу "${query}" ничего не найдено`
                    : "Планеты не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
