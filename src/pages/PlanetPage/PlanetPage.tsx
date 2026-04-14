import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getMockPlanet, getMockSegmentForPlanet, PLANETS_MOCK } from "../../modules/mock";
import { fallbackImageUrl, resolveMediaUrl, type PlanetJSON } from "../../cosmosApi";

export default function PlanetPage() {
  const [planet, setPlanet] = useState<PlanetJSON | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      setPlanet(null);
      return;
    }
    setMediaError(false);
    const resolved =
      getMockPlanet(Number(id)) ?? PLANETS_MOCK.find((p) => p.planet_id === Number(id)) ?? null;
    setPlanet(resolved);
  }, [id]);

  const segment = planet ? getMockSegmentForPlanet(planet.planet_id) : undefined;
  const hasRail = Boolean(segment);

  const videoUrl = useMemo(() => (planet ? resolveMediaUrl(planet.video) : ""), [planet]);
  const posterUrl = useMemo(
    () => (planet ? resolveMediaUrl(planet.image) || fallbackImageUrl() : fallbackImageUrl()),
    [planet],
  );
  const showVideo = Boolean(planet?.video?.trim()) && !mediaError;

  if (!id || !planet) {
    return (
      <div className="detail-page">
        <div className="planet-not-found">
          <h1>Планета не найдена</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <main className="detail-shorts">
        <div className="detail-shorts__video-col">
          <div
            className={`detail-video-frame detail-video-frame--shorts${hasRail ? " detail-video-frame--with-rail" : ""}`}
          >
            {showVideo ? (
              <video
                className="detail-video"
                autoPlay
                muted
                loop
                playsInline
                onError={() => setMediaError(true)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <img className="detail-video" src={posterUrl} alt={planet.title} />
            )}
            {hasRail && segment ? (
              <aside className="detail-video__rail" aria-label="Параметры расчёта перелёта">
                <div className="detail-rail-item" title="Характеристическая скорость Δv">
                  <div className="detail-rail-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 3c0 0-3 4.5-3 9.5 0 2.5 1 4.5 2.5 6L12 21l.5-2c1.5-1.5 2.5-3.5 2.5-6C15 7.5 12 3 12 3z"
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 14h6M10.5 17h3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <path d="M12 10v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="detail-rail-item__value">{Math.round(segment.delta_v_ms)}</span>
                  <span className="detail-rail-item__unit">м/с</span>
                  <span className="detail-rail-item__label">Δv</span>
                </div>
                <div className="detail-rail-item" title="Требуемое топливо">
                  <div className="detail-rail-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 3C9.5 3 8 5 8 7.5V9C6.5 9.5 5.5 11 5.5 13V18C5.5 20 7 21.5 9 21.5H15C17 21.5 18.5 20 18.5 18V13C18.5 11 17.5 9.5 16 9V7.5C16 5 14.5 3 12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                      <path d="M10 9H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="detail-rail-item__value">{Math.round(segment.propellant_kg)}</span>
                  <span className="detail-rail-item__unit">кг</span>
                  <span className="detail-rail-item__label">Топливо</span>
                </div>
              </aside>
            ) : null}
            <div className="detail-video__caption detail-video__caption--shorts">
              <p className="detail-video__route">
                {planet.from} — {planet.to}
              </p>
              <p className="detail-video__blurb">{planet.description}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
