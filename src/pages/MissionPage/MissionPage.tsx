import { type FormEvent, useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate, useParams } from "react-router-dom";
import BreadCrumbs from "../../components/BreadCrumbs/BreadCrumbs";
import {
  calculatePropellantKg,
  fallbackImageUrl,
  getInterplanetaryFlightRequest,
  resolveMediaUrl,
} from "../../cosmosApi";
import type { InterplanetaryFlightRequestDetailJSON, PlanetInRequestRowJSON } from "../../cosmosApi";

type SegmentCalcParams = {
  dryMassKg: number;
  ispSec: number;
};

const DEFAULT_ISP_SEC = 320;

function MissionLab2Header() {
  return (
    <header className="site-header site-header-main">
      <div className="header-spacer" aria-hidden />
      <Link to="/" className="header-home header-logo-center">
        <img src="/logo.png" alt="Interplanetary flight" className="header-home__icon" />
      </Link>
      <div className="header-spacer" aria-hidden />
    </header>
  );
}

function defaultDryMassKg(detail: InterplanetaryFlightRequestDetailJSON | null): number {
  const v = detail?.spacecraft_dry_mass_kg;
  if (v != null && Number.isFinite(v) && v > 0) return Math.round(v);
  return 2000;
}

export default function MissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<InterplanetaryFlightRequestDetailJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [segmentParams, setSegmentParams] = useState<Record<number, SegmentCalcParams>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const loaded = await getInterplanetaryFlightRequest(Number(id));
        if (!cancelled) {
          setData(loaded);
          if (loaded) {
            const dryDefault = defaultDryMassKg(loaded);
            const next: Record<number, SegmentCalcParams> = {};
            for (const row of loaded.flights_in_request) {
              next[row.planet_id] = {
                dryMassKg: dryDefault,
                ispSec: DEFAULT_ISP_SEC,
              };
            }
            setSegmentParams(next);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateSegmentParams = (planetId: number, patch: Partial<SegmentCalcParams>) => {
    setSegmentParams((prev) => ({
      ...prev,
      [planetId]: {
        dryMassKg: prev[planetId]?.dryMassKg ?? defaultDryMassKg(data),
        ispSec: prev[planetId]?.ispSec ?? DEFAULT_ISP_SEC,
        ...patch,
      },
    }));
  };

  const handleToolbarSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/?${new URLSearchParams({ query: q }).toString()}` : "/");
  };

  const handleDeleteMission = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Удалить заявку?")) return;
    navigate("/");
  };

  if (loading) {
    return (
      <div className="mission-basket-page mission-page-lab2">
        <MissionLab2Header />
        <BreadCrumbs />
        <div className="system-load-detail">
          <div className="planets-page__loading">
            <Spinner animation="border" role="status" aria-label="Загрузка" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !id) {
    return (
      <div className="mission-basket-page mission-page-lab2">
        <MissionLab2Header />
        <BreadCrumbs />
        <div className="system-load-detail">
          <div className="planet-not-found">
            <h1>Заявка не найдена</h1>
          </div>
        </div>
      </div>
    );
  }

  const sortedRows = [...data.flights_in_request].sort((a, b) => a.segment_order - b.segment_order);

  const segmentFuelKg = (row: PlanetInRequestRowJSON) => {
    const p = segmentParams[row.planet_id] ?? {
      dryMassKg: defaultDryMassKg(data),
      ispSec: DEFAULT_ISP_SEC,
    };
    return calculatePropellantKg(p.dryMassKg, row.delta_v_ms, p.ispSec);
  };

  return (
    <div className="mission-basket-page mission-page-lab2">
      <MissionLab2Header />
      <BreadCrumbs />

      <div className="toolbar">
        <div className="toolbar-inner">
          <form className="search-form" onSubmit={handleToolbarSearch}>
            <input
              type="text"
              name="query"
              className="search-input"
              placeholder="Поиск маршрутов и планет"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Поиск маршрутов и планет"
            />
          </form>
          <div className="toolbar-basket">
            <Link to={`/mission/${id}`} className="system-load-icon" aria-label="Текущая заявка">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16v2H4V7zm2 4h12v2H6v-2zm3 4h6v2H9v-2z" fill="currentColor" />
              </svg>
              <span className="system-load-icon__badge">{data.route_count}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="system-load-detail">
        <div className="system-load-detail__header-card">
          <div className="system-load-detail__header-top">
            <div className="system-load-detail__header-main">
              <h1 className="system-load-detail__title">Заявка № {id}</h1>
              <p className="system-load-detail__description">{data.description}</p>
            </div>
            <form onSubmit={handleDeleteMission} className="system-load-detail__delete-form">
              <button
                type="submit"
                className="system-load-detail__delete-icon"
                title="Удалить заявку"
                aria-label="Удалить заявку"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 3h6l1 2h5v2H3V5h5l1-2zm-1 6h2v10H8V9zm4 0h2v10h-2V9zm4 0h2v10h-2V9z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="basket-segments">
          <div className="basket-segments__head" aria-hidden="true">
            <div className="basket-segments__cell basket-segments__cell--thumb">Фото</div>
            <div className="basket-segments__cell">Маршрут</div>
            <div className="basket-segments__cell">Откуда</div>
            <div className="basket-segments__cell">Куда</div>
            <div className="basket-segments__cell basket-segments__cell--num">Δv (м/с)</div>
            <div className="basket-segments__cell basket-segments__cell--num basket-segments__cell--fuel">
              Топливо (кг)
            </div>
          </div>

          {sortedRows.map((row) => {
            const params = segmentParams[row.planet_id] ?? {
              dryMassKg: defaultDryMassKg(data),
              ispSec: DEFAULT_ISP_SEC,
            };
            const fuelKg = segmentFuelKg(row);
            const thumb = resolveMediaUrl(row.planet.image) || fallbackImageUrl();

            return (
              <article key={`${row.planet_id}-${row.segment_order}`} className="basket-segment">
                <div className="basket-segment__row">
                  <div className="basket-segments__cell basket-segments__cell--thumb">
                    <img src={thumb} alt={row.planet.title} />
                  </div>
                  <div className="basket-segments__cell basket-segments__cell--strong">{row.planet.title}</div>
                  <div className="basket-segments__cell">{row.planet.from}</div>
                  <div className="basket-segments__cell">{row.planet.to}</div>
                  <div className="basket-segments__cell basket-segments__cell--num basket-segments__cell--highlight">
                    {Math.round(row.delta_v_ms)}
                  </div>
                  <div className="basket-segments__cell basket-segments__cell--num basket-segments__cell--fuel basket-segments__cell--highlight">
                    {Math.round(fuelKg)}
                  </div>
                </div>
                <div className="basket-segment__panel">
                  <div className="basket-segment__form">
                    <label className="basket-segment__field">
                      <span className="basket-segment__field-name">Масса, кг</span>
                      <input
                        type="number"
                        name="dry_mass_kg"
                        step={1}
                        className="basket-segment__input"
                        value={params.dryMassKg}
                        onChange={(e) =>
                          updateSegmentParams(row.planet_id, {
                            dryMassKg: Math.max(1, Number(e.target.value) || defaultDryMassKg(data)),
                          })
                        }
                      />
                    </label>
                    <label className="basket-segment__field">
                      <span className="basket-segment__field-name">Isp, с</span>
                      <input
                        type="number"
                        name="isp_sec"
                        step={1}
                        className="basket-segment__input"
                        value={params.ispSec}
                        onChange={(e) =>
                          updateSegmentParams(row.planet_id, {
                            ispSec: Math.max(1, Number(e.target.value) || DEFAULT_ISP_SEC),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
