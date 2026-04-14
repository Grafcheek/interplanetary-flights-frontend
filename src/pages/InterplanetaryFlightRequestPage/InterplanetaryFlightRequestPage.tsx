import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cloneInterplanetaryFlightDetail, MOCK_CART, MOCK_INTERPLANETARY_FLIGHT_DETAIL } from "../../modules/mock";
import { fallbackImageUrl, resolveMediaUrl, type InterplanetaryFlightRequestDetailJSON } from "../../cosmosApi";

function ToolbarBasketStatic() {
  if (!MOCK_CART.has_draft || MOCK_CART.id == null) {
    return <div className="toolbar-basket" />;
  }

  return (
    <div className="toolbar-basket">
      <Link
        to={`/interplanetary-flight/${MOCK_CART.id}`}
        className="interplanetary-flight-request-link"
        aria-label="Interplanetary flight request"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v2H4V7zm2 4h12v2H6v-2zm3 4h6v2H9v-2z" fill="currentColor" />
        </svg>
        <span className="interplanetary-flight-request-link__badge">{MOCK_CART.planets_count}</span>
      </Link>
    </div>
  );
}

export default function InterplanetaryFlightRequestPage() {
  const { id } = useParams();
  const [data, setData] = useState<InterplanetaryFlightRequestDetailJSON | null>(null);

  const loadMock = useCallback(() => {
    if (!id) return null;
    const n = Number(id);
    if (n === MOCK_INTERPLANETARY_FLIGHT_DETAIL.interplanetary_flight_request_id) {
      return cloneInterplanetaryFlightDetail(MOCK_INTERPLANETARY_FLIGHT_DETAIL);
    }
    return null;
  }, [id]);

  useEffect(() => {
    setData(loadMock());
  }, [loadMock]);

  if (!data) {
    return (
      <div className="interplanetary-flight-request-shell">
        <p className="flight-request-not-found">Межпланетная заявка не найдена.</p>
      </div>
    );
  }

  const r = data;

  return (
    <div className="interplanetary-flight-request-shell">
      <div className="toolbar">
        <div className="toolbar-inner">
          <form action="/" className="search-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              name="query"
              className="search-input"
              placeholder="Поиск маршрутов и планет"
              value=""
              readOnly
              aria-readonly
            />
          </form>
          <ToolbarBasketStatic />
        </div>
      </div>
      <div className="interplanetary-flight-request-page">
        <div className="flight-request-stats">
          <div className="flight-request-stat-card">
            <span className="flight-request-stat-card__label">Характеристическая скорость (Δv)</span>
            <span className="flight-request-stat-card__value">{Math.round(r.total_delta_v_ms)} м/с</span>
          </div>
          <div className="flight-request-stat-card">
            <span className="flight-request-stat-card__label">Необходимое количество топлива</span>
            <span className="flight-request-stat-card__value">{Math.round(r.total_fuel_mass_kg)} кг</span>
          </div>
        </div>
        <div className="interplanetary-flights-in-request-list">
          <div
            className="interplanetary-flight-in-request-card interplanetary-flight-in-request-card--header"
            aria-hidden="true"
          >
            <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--result">
              Топливо (кг)
            </div>
            <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--result">
              Δv (м/с)
            </div>
            <div className="interplanetary-flight-in-request-card__cell">Маршрут (планета)</div>
            <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--image">
              Изображение
            </div>
          </div>
          {r.flights_in_request.map((row) => {
            const img = resolveMediaUrl(row.planet.image) || fallbackImageUrl();
            return (
              <div className="interplanetary-flight-in-request-card" key={`${row.planet_id}-${row.segment_order}`}>
                <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--result">
                  {Math.round(row.propellant_kg)}
                </div>
                <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--result">
                  {Math.round(row.delta_v_ms)}
                </div>
                <div className="interplanetary-flight-in-request-card__cell">{row.planet.title}</div>
                <div className="interplanetary-flight-in-request-card__cell interplanetary-flight-in-request-card__cell--image">
                  <img src={img} alt={row.planet.title} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
