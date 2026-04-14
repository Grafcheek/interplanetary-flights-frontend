import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fallbackImageUrl, resolveMediaUrl, type PlanetJSON } from "../../cosmosApi";

function photoSrc(image: string, imageError: boolean): string {
  if (imageError || !image?.trim()) return fallbackImageUrl();
  return resolveMediaUrl(image);
}

export default function PlanetCard({ planet }: { planet: PlanetJSON }) {
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

  return (
    <Link to={`/planet/${planet.planet_id}`} className="card">
      <img
        src={imageError ? fallbackImageUrl() : imageUrl}
        alt={planet.title}
        onError={handleImageError}
      />
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
  );
}
