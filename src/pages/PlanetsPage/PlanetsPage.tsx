import { useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import PlanetsList from "../../components/PlanetsList/PlanetsList";
import PlanetFilterBar from "../../components/PlanetFilterBar/PlanetFilterBar";
import type { PlanetJSON } from "../../cosmosApi";
import { filterMockPlanetsByQuery, PLANETS_MOCK } from "../../modules/mock";

export default function PlanetsPage() {
  const [planets, setPlanets] = useState<PlanetJSON[]>(PLANETS_MOCK);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPlanets(filterMockPlanetsByQuery(""));
  }, []);

  const handleSearch = () => {
    setLoading(true);
    try {
      setPlanets(filterMockPlanetsByQuery(query));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planets-page">
      <div className="toolbar">
        <div className="toolbar-inner">
          <PlanetFilterBar query={query} onQueryChange={setQuery} onSearch={handleSearch} />
          <div className="toolbar-basket">
            <div className="interplanetary-flight-request-link" aria-label="Корзина" title="Корзина">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16v2H4V7zm2 4h12v2H6v-2zm3 4h6v2H9v-2z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="space">
        <main className="planets-page__main">
          {loading ? (
            <div className="planets-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : (
            <div className="planets-page__grid">
              {planets.length > 0 ? (
                <PlanetsList planets={planets} />
              ) : (
                <div className="planets-page__empty">
                  {query.trim() ? `По запросу «${query}» ничего не найдено` : "Планеты не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
