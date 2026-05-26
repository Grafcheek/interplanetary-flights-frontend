import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { getMockPlanet } from "../../modules/mock";
import { getPlanetAxios } from "../../modules/planetsApi";
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
    let cancelled = false;
    const run = async () => {
      const data = await getPlanetAxios(id);
      if (cancelled) return;
      if (data?.title) {
        setPlanetTitle(data.title);
        return;
      }
      const p = getMockPlanet(id);
      setPlanetTitle(p?.title ?? `Планета ${id}`);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const crumbs: Crumb[] = (() => {
    if (pathname === ROUTES.PLANETS) {
      return [{ label: "Главная" }];
    }

    if (pathname === ROUTES.SIGN_IN) {
      return [{ label: "Главная", to: ROUTES.PLANETS }, { label: "Вход" }];
    }

    if (pathname === ROUTES.SIGN_UP) {
      return [{ label: "Главная", to: ROUTES.PLANETS }, { label: "Регистрация" }];
    }

    if (pathname === ROUTES.INTERPLANETARY_FLIGHTS) {
      return [{ label: "Главная", to: ROUTES.PLANETS }, { label: "Заявки" }];
    }

    if (pathname === ROUTES.PROFILE) {
      return [{ label: "Главная", to: ROUTES.PLANETS }, { label: "Личный кабинет" }];
    }

    const planetMatch = matchPath(ROUTES.PLANET, pathname);
    if (planetMatch?.params.id) {
      const title =
        planetTitle ??
        (planetMatch.params.id ? `Планета ${planetMatch.params.id}` : "Планета");
      return [{ label: "Главная", to: ROUTES.PLANETS }, { label: title }];
    }

    const flightMatch = matchPath(ROUTES.INTERPLANETARY_FLIGHT, pathname);
    if (flightMatch?.params.id) {
      return [
        { label: "Главная", to: ROUTES.PLANETS },
        { label: "Заявка на расчёт" },
      ];
    }

    return [{ label: "Главная", to: ROUTES.PLANETS }, { label: "Страница" }];
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
