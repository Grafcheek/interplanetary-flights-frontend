import type {
  InterplanetaryFlightRequestDetailJSON,
  PlanetCartJSON,
  PlanetInRequestRowJSON,
  PlanetJSON,
} from "../cosmosApi";
import { calculateHohmannDeltaVms, calculatePropellantKg } from "../cosmosApi";

const DEFAULT_IMAGE = "/mock/Earth.jpg";
const DEFAULT_VIDEO = "/mock/Earth_vid.mp4";

/** Имя файла картинки в public/mock (растр). Юпитер — .jpeg как в ваших файлах. */
const PLANET_IMAGE_FILE: Record<string, string> = {
  Юпитер: "Jupiter.jpeg",
  Сатурн: "Saturn.jpg",
  Уран: "Uranus.jpg",
  Нептун: "Neptune.jpg",
};

/** Обратные перелёты и любые неизвестные названия — Earth по умолчанию. */
function planetImageVideo(title: string): { image: string; video: string } {
  if (title.startsWith("Обратный")) {
    return { image: DEFAULT_IMAGE, video: DEFAULT_VIDEO };
  }
  const file = PLANET_IMAGE_FILE[title];
  if (!file) {
    return { image: DEFAULT_IMAGE, video: DEFAULT_VIDEO };
  }
  const image = `/mock/${file}`;
  // Видео Земли по умолчанию для всех, кроме Сатурна (у него своё Saturn_vid.mp4).
  if (title === "Сатурн") {
    return { image, video: "/mock/Saturn_vid.mp4" };
  }
  return { image, video: DEFAULT_VIDEO };
}

/** Каталог планет (услуга) — данные как в lab1 Go `GetInterplanetaryFlights`. */
export const PLANETS_MOCK: PlanetJSON[] = [
  {
    planet_id: 1,
    title: "Юпитер",
    from: "Земля",
    to: "Юпитер",
    description:
      "Упрощённый перелёт к газовому гиганту. Модель: переход Гомана вокруг Солнца (без гравитационных манёвров, без учёта наклонения орбит).",
    ...planetImageVideo("Юпитер"),
    from_orbit_au: 1.0,
    to_orbit_au: 5.204,
    launch_date: "2026-04-12",
    price_credits: 12800,
  },
  {
    planet_id: 2,
    title: "Сатурн",
    from: "Земля",
    to: "Сатурн",
    description:
      "Дальняя цель: перелёт к Сатурну. В реальности часто используют гравитационные манёвры (как у Voyager), но здесь считаем идеализированный переход Гомана.",
    ...planetImageVideo("Сатурн"),
    from_orbit_au: 1.0,
    to_orbit_au: 9.583,
    launch_date: "2026-05-03",
    price_credits: 19250,
  },
  {
    planet_id: 3,
    title: "Уран",
    from: "Земля",
    to: "Уран",
    description: "Перелёт к ледяному гиганту (идеализированная гелиоцентрическая траектория).",
    ...planetImageVideo("Уран"),
    from_orbit_au: 1.0,
    to_orbit_au: 19.218,
    launch_date: "2026-06-18",
    price_credits: 26500,
  },
  {
    planet_id: 4,
    title: "Нептун",
    from: "Земля",
    to: "Нептун",
    description:
      "Одна из самых «дорогих» целей по Δv в упрощённой модели. Voyager 2 долетел до Нептуна с помощью гравитационных манёвров — здесь их не учитываем.",
    ...planetImageVideo("Нептун"),
    from_orbit_au: 1.0,
    to_orbit_au: 30.11,
    launch_date: "2026-07-22",
    price_credits: 31040,
  },
  {
    planet_id: 5,
    title: "Обратный с Юпитера",
    from: "Юпитер",
    to: "Земля",
    description:
      "Обратный перелёт с орбиты Юпитера на Землю. Те же параметры орбит, но теперь считаем характеристическую скорость и топливо для пути домой.",
    ...planetImageVideo("Обратный с Юпитера"),
    from_orbit_au: 5.204,
    to_orbit_au: 1.0,
    launch_date: "2026-08-01",
    price_credits: 9800,
  },
  {
    planet_id: 6,
    title: "Обратный с Сатурна",
    from: "Сатурн",
    to: "Земля",
    description:
      "Обратный перелёт с орбиты Сатурна на Землю: моделируем возврат после глубокой внешней миссии и оцениваем Δv и массу топлива.",
    ...planetImageVideo("Обратный с Сатурна"),
    from_orbit_au: 9.583,
    to_orbit_au: 1.0,
    launch_date: "2026-09-10",
    price_credits: 14200,
  },
  {
    planet_id: 7,
    title: "Обратный с Урана",
    from: "Уран",
    to: "Земля",
    description:
      "Обратный перелёт с орбиты Урана на Землю. Ледяной гигант остаётся позади, а мы считаем Δv и топливо для возвращения к Земле.",
    ...planetImageVideo("Обратный с Урана"),
    from_orbit_au: 19.218,
    to_orbit_au: 1.0,
    launch_date: "2026-10-05",
    price_credits: 22100,
  },
];

const DRY_KG = 2000;
const ISP_S = 320;

function rowForPlanetId(id: number, order: number, qty: number, primary: boolean): PlanetInRequestRowJSON {
  const planet = getMockPlanet(id)!;
  const dv = calculateHohmannDeltaVms(planet.from_orbit_au, planet.to_orbit_au);
  const prop = calculatePropellantKg(DRY_KG, dv, ISP_S);
  return {
    planet_id: id,
    segment_order: order,
    quantity: qty,
    is_primary: primary,
    delta_v_ms: dv,
    propellant_kg: prop,
    planet,
  };
}

function buildRequestDetail(): InterplanetaryFlightRequestDetailJSON {
  const ids = [1, 5, 2, 6, 3, 7, 4];
  const flights: PlanetInRequestRowJSON[] = ids.map((pid, i) =>
    rowForPlanetId(pid, i + 1, 1, i === 0),
  );
  const totalDv = flights.reduce((s, r) => s + r.delta_v_ms, 0);
  const totalFuel = flights.reduce((s, r) => s + r.propellant_kg, 0);
  return {
    interplanetary_flight_request_id: 1,
    title: "Расчёт параметров межпланетного перелёта",
    description:
      "Заявка на расчёт характеристической скорости Δv и необходимого количества топлива для указанных масс космического аппарата и двигательной установки.",
    route_count: flights.length,
    engine_mass_kg: 320,
    spacecraft_dry_mass_kg: DRY_KG,
    total_delta_v_ms: totalDv,
    total_fuel_mass_kg: totalFuel,
    flights_in_request: flights,
  };
}

export const MOCK_INTERPLANETARY_FLIGHT_DETAIL: InterplanetaryFlightRequestDetailJSON =
  buildRequestDetail();

export const MOCK_CART: PlanetCartJSON = {
  has_draft: true,
  planets_count: MOCK_INTERPLANETARY_FLIGHT_DETAIL.route_count,
  id: 1,
};

export function getMockPlanet(id: number): PlanetJSON | undefined {
  return PLANETS_MOCK.find((p) => p.planet_id === id);
}

export function getMockSegmentForPlanet(planetId: number): PlanetInRequestRowJSON | undefined {
  return MOCK_INTERPLANETARY_FLIGHT_DETAIL.flights_in_request.find((r) => r.planet_id === planetId);
}

/** Поиск по названию планеты и полям маршрута (откуда / куда), как в lab1. */
export function filterMockPlanetsByQuery(query: string): PlanetJSON[] {
  const q = query.trim();
  if (!q) return [...PLANETS_MOCK];

  const t = q.toLowerCase();
  return PLANETS_MOCK.filter(
    (p) =>
      p.title.toLowerCase().includes(t) ||
      p.from.toLowerCase().includes(t) ||
      p.to.toLowerCase().includes(t),
  );
}

export function cloneInterplanetaryFlightDetail(
  src: InterplanetaryFlightRequestDetailJSON,
): InterplanetaryFlightRequestDetailJSON {
  return JSON.parse(JSON.stringify(src)) as InterplanetaryFlightRequestDetailJSON;
}
