import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { getMockPlanet } from "../../modules/mock";
import { ROUTES } from "../../routePaths";

type Crumb = { label: string; to?: string };

export default function BreadCrumbs() {
  const { pathname } = useLocation();
  const [planetTitle, setPlanetTitle] = useState<string | null>(null);

  useEffect(() => {
    const m = matchPath(ROUTES.PLANET, pathname);
    const rawId = m?.params.id;
    if (rawId == null) {
      setPlanetTitle(null);
      return;
    }
    const id = Number(rawId);
    const p = getMockPlanet(id);
    setPlanetTitle(p?.title ?? `Планета ${id}`);
  }, [pathname]);

  const crumbs: Crumb[] = (() => {
    if (pathname === "/" || pathname === "") {
      return [{ label: "Главная" }];
    }

    const planetMatch = matchPath(ROUTES.PLANET, pathname);
    if (planetMatch?.params.id) {
      const title =
        planetTitle ??
        (planetMatch.params.id ? `Планета ${planetMatch.params.id}` : "Планета");
      return [{ label: "Главная", to: "/" }, { label: title }];
    }

    return [{ label: "Главная", to: "/" }, { label: "Страница" }];
  })();

  return (
    <nav className="app-breadcrumbs" aria-label="Навигационная цепочка">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="app-breadcrumbs__item">
              {crumb.to != null && !last ? (
                <Link to={crumb.to} className="app-breadcrumbs__link">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "app-breadcrumbs__current" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
