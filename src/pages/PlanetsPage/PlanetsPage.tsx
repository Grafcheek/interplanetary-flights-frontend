import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ProgressBar } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import PlanetsList from "../../components/PlanetsList/PlanetsList";
import PlanetFilterBar from "../../components/PlanetFilterBar/PlanetFilterBar";
import type { PlanetJSON } from "../../cosmosApi";
import {
  fallbackImageUrl,
  listPlanets,
  planetClipDescription,
  resolveMediaUrl,
} from "../../cosmosApi";
import { filterMockPlanetsByQuery, PLANETS_MOCK } from "../../modules/mock";
import { usePlanetImageSearch } from "../../hooks/usePlanetImageSearch";

export default function PlanetsPage() {
  const [planets, setPlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [clipSourcePlanets, setClipSourcePlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const list = await listPlanets();
      if (cancelled) return;
      const resolvedList = list.length > 0 ? list : filterMockPlanetsByQuery("");
      setPlanets(resolvedList);
      setClipSourcePlanets(resolvedList);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const clipItems = useMemo(
    () => clipSourcePlanets.map((p) => ({ id: p.planet_id, description: planetClipDescription(p) })),
    [clipSourcePlanets],
  );

  const { items: clipProcessed, ready: clipReady, progress: clipProgress, imageEmbedding, workerError, searchByImage, resetSearch } =
    usePlanetImageSearch(clipItems, clipSessionActive);

  const planetById = useMemo(() => {
    const m = new Map<number, PlanetJSON>();
    clipSourcePlanets.forEach((p) => m.set(p.planet_id, p));
    return m;
  }, [clipSourcePlanets]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await listPlanets({ query });
      setPlanets(data);
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
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    searchByImage(file);
  };

  const handleClearImage = () => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    resetSearch();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const imageSearchActive = Boolean(imageEmbedding);
  const visibleClipRows = imageSearchActive ? clipProcessed.filter((item) => item.isVisible) : [];
  const showClipProgress = clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;

  return (
    <div className="planets-page">
      <div className="toolbar">
        <div className="toolbar-inner">
          <PlanetFilterBar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
          />
          <div className="toolbar-basket">
            <div
              className="interplanetary-flight-request-link interplanetary-flight-request-link--disabled"
              aria-label="Заявка недоступна"
              title="Заявка недоступна"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16v2H4V7zm2 4h12v2H6v-2zm3 4h6v2H9v-2z" fill="currentColor" />
              </svg>
              <span className="interplanetary-flight-request-link__badge">0</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space">
        <main className="planets-page__main">
          <section className="clip-search-section">
            {workerError ? (
              <Alert variant="warning">Не удалось загрузить CLIP модель: {workerError}</Alert>
            ) : null}
            <div className="clip-search-section__panel">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="clip-search-section__file-input"
                onChange={handleImageUpload}
              />
              <div className="clip-search-section__preview-wrap">
                {selectedImage ? (
                  <img src={selectedImage} alt="" className="clip-search-section__preview-image" />
                ) : (
                  <div className="clip-search-section__placeholder-image">Фото для CLIP</div>
                )}
              </div>
              <div className="clip-search-section__action-panel">
                <button
                  type="button"
                  className="search-btn clip-search-btn"
                  onClick={handleUploadButtonClick}
                  disabled={clipItems.length === 0 || showClipProgress}
                >
                  {showClipProgress ? "Загрузка модели..." : "Поиск по изображению"}
                </button>
                {showClipProgress ? <ProgressBar now={clipProgress} label={`${clipProgress}%`} /> : null}
                <button
                  type="button"
                  className="search-btn clip-search-btn"
                  onClick={handleClearImage}
                  disabled={!selectedImage}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </section>
          {loading ? (
            <div className="planets-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : imageSearchActive ? (
            <div className="planets-page__grid">
              {visibleClipRows.length === 0 ? (
                <div className="planets-page__empty">
                  Нет подходящих перелетов выше порога. Попробуй другое изображение.
                </div>
              ) : (
                <ul className="clip-results-list">
                  {visibleClipRows.map((item) => {
                    const planet = planetById.get(item.id);
                    if (!planet) return null;
                    return (
                      <li key={planet.planet_id}>
                        <Link to={`/planet/${planet.planet_id}`} className="clip-result-row">
                          <img
                            src={resolveMediaUrl(planet.image) || fallbackImageUrl()}
                            alt={planet.title}
                            className="clip-result-row__image"
                          />
                          <div className="clip-result-row__content">
                            <h5>{planet.title}</h5>
                            <p>{planet.from} - {planet.to}</p>
                            <p>{planet.description}</p>
                          </div>
                          <div className="clip-result-row__stats">
                            <span>{(item.score * 100).toFixed(1)}%</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="planets-page__grid">
              {planets.length > 0 ? (
                <PlanetsList planets={planets} />
              ) : (
                <div className="planets-page__empty">
                  {query.trim() ? `По запросу "${query}" ничего не найдено` : "Планеты не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
