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
import { isGuestMode } from "../../config/appMode";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { applyQuery, setQuery } from "../../store/slices/planetFilterSlice";

export default function PlanetsPage() {
  const [planets, setPlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [clipSourcePlanets, setClipSourcePlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [loading, setLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [clipSessionActiveState, setClipSessionActive] = useState(false);
  const clipSessionActive = !isGuestMode && clipSessionActiveState;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.planetFilter.query);
  const appliedQuery = useAppSelector((state) => state.planetFilter.appliedQuery);

  const loadPlanets = async (queryText: string) => {
    const normalized = queryText.trim();
    const data = await listPlanetsAxios(normalized ? { query: normalized } : undefined);

    if (data.length > 0) {
      setPlanets(data);
      setClipSourcePlanets(data);
      return;
    }

    if (normalized) {
      const filtered = filterMockPlanetsByQuery(normalized);
      setPlanets(filtered);
      setClipSourcePlanets(filtered);
      return;
    }

    setPlanets(PLANETS_MOCK);
    setClipSourcePlanets(PLANETS_MOCK);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await loadPlanets(appliedQuery);
        if (cancelled) return;
      } catch {
        if (cancelled) return;
        setPlanets(PLANETS_MOCK);
        setClipSourcePlanets(PLANETS_MOCK);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [appliedQuery]);

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
    dispatch(applyQuery());
    setLoading(true);
    try {
      await loadPlanets(query);
    } catch {
      const filtered = filterMockPlanetsByQuery(query);
      setPlanets(filtered);
      setClipSourcePlanets(filtered);
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
          {!isGuestMode ? (
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="clip-search-section__file-input"
              onChange={handleImageUpload}
            />
          ) : null}
          <PlanetFilterBar
            query={query}
            onQueryChange={(value) => dispatch(setQuery(value))}
            onSearch={handleSearch}
            onImageUploadClick={handleUploadButtonClick}
            onClearImage={handleClearImage}
            clipButtonLabel={clipButtonLabel}
            disableClipSearch={clipItems.length === 0 || showClipProgress}
            disableClipReset={!selectedImageFile && !imageSearchActive}
            showImageSearch={!isGuestMode}
          />
          {!isGuestMode ? <CartRow /> : null}
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
