import { Link } from "react-router-dom";
import { useEffect, useState, type MouseEvent } from "react";
import {
  CART_UPDATED_EVENT,
  fallbackImageUrl,
  resolveMediaUrl,
  type PlanetJSON,
} from "../../cosmosApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addPlanetToFlightRequest } from "../../store/slices/flightRequestSlice";
import { planetPath } from "../../routePaths";

function photoSrc(image: string, imageError: boolean): string {
  if (imageError || !image?.trim()) return fallbackImageUrl();
  return resolveMediaUrl(image);
}

interface PlanetCardProps {
  planet: PlanetJSON;
  similarityPercent?: number;
}

export default function PlanetCard({ planet, similarityPercent }: PlanetCardProps) {
  const dispatch = useAppDispatch();
  const applicationMutationLoading = useAppSelector(
    (s) => s.flightRequest.applicationMutationLoading,
  );
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(photoSrc(planet.image, false));

  useEffect(() => {
    setImageError(false);
    setImageUrl(photoSrc(planet.image, false));
  }, [planet.image]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(fallbackImageUrl());
  };

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(addPlanetToFlightRequest(planet.planet_id)).unwrap();
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (err) {
      window.alert(String(err));
    }
  };

  return (
    <div className="card-wrapper">
      <Link to={planetPath(planet.planet_id)} className="card">
        <img
          src={imageError ? fallbackImageUrl() : imageUrl}
          alt={planet.title}
          onError={handleImageError}
        />
        {typeof similarityPercent === "number" ? (
          <span
            className="card__similarity"
            aria-label={`Сходство ${similarityPercent.toFixed(1)} процентов`}
          >
            {similarityPercent.toFixed(1)}%
          </span>
        ) : null}
        <div className="card__body">
          <div className="card__title-row">
            <h2 className="card__title">{planet.title}</h2>
            <span className="card__icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="color-nasa-red" cx="16" cy="16" r="16" />
                <path
                  d="M8 16.956h12.604l-3.844 4.106 1.252 1.338L24 16l-5.988-6.4-1.252 1.338 3.844 4.106H8v1.912z"
                  className="color-spacesuit-white"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
      {isAuthenticated ? (
        <button
          type="button"
          className="card-add-btn"
          onClick={handleAdd}
          disabled={applicationMutationLoading}
        >
          {applicationMutationLoading ? "Добавление…" : "Добавить в заявку"}
        </button>
      ) : null}
    </div>
  );
}
