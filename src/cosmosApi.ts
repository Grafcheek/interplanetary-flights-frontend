export interface PlanetJSON {
  planet_id: number;
  title: string;
  from: string;
  to: string;
  description: string;
  image: string;
  video: string;
  from_orbit_au: number;
  to_orbit_au: number;
  launch_date: string;
  price_credits: number;
  short_description_en?: string;
}

export interface PlanetInRequestRowJSON {
  planet_id: number;
  segment_order: number;
  quantity: number;
  is_primary: boolean;
  delta_v_ms: number;
  propellant_kg: number;
  planet: PlanetJSON;
}

export interface InterplanetaryFlightRequestDetailJSON {
  interplanetary_flight_request_id: number;
  title: string;
  description: string;
  route_count: number;
  engine_mass_kg: number;
  spacecraft_dry_mass_kg: number;
  total_delta_v_ms: number;
  total_fuel_mass_kg: number;
  flights_in_request: PlanetInRequestRowJSON[];
}

export type PlanetCartJSON = {
  id: number | null;
  has_draft: boolean;
  planets_count: number;
};

export const CART_UPDATED_EVENT = "interplanetary-flight-request-cart-updated";

function minioBase(): string {
  const raw = import.meta.env.VITE_MINIO_BASE as string | undefined;
  return raw?.replace(/\/$/, "") ?? "http://localhost:9000";
}

export function fallbackImageUrl(): string {
  return "/mock/Earth.jpg";
}

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/") ||
    key.startsWith("blob:") ||
    key.startsWith("data:")
  ) {
    return key;
  }
  const base = minioBase();
  if (base) {
    return `${base}/spaceobjects/${key.replace(/^\//, "")}`;
  }
  return fallbackImageUrl();
}

function routeHint(titleRaw: string | undefined): string {
  const title = titleRaw?.toLowerCase().trim() ?? "";
  if (title.includes("юпитер")) return "Route type: Deep-space gas giant transfer.";
  if (title.includes("сатурн")) return "Route type: Outer ringed planet expedition.";
  if (title.includes("уран")) return "Route type: Ice giant long-range trajectory.";
  if (title.includes("нептун")) return "Route type: Far outer-system mission.";
  if (title.includes("обратный")) return "Route type: Return transfer to Earth orbit.";
  return "Route type: Interplanetary transfer mission.";
}

export function planetClipDescription(planet: PlanetJSON): string {
  const hint = routeHint(planet.title);
  const en = planet.short_description_en?.trim();
  if (en) return `${hint} ${en}`;
  const title = planet.title?.trim();
  const description = planet.description?.trim();
  if (title && description) return `${hint} ${title}. ${description}`;
  if (description) return `${hint} ${description}`;
  if (title) return `${hint} ${title}`;
  return hint;
}

export async function getFlightCart(): Promise<PlanetCartJSON> {
  const { MOCK_CART } = await import("./modules/mock");
  try {
    const res = await fetch("/api/interplanetaryflightrequests/cart-icon", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as { id?: number | null; count?: number };
    return {
      id: raw.id ?? null,
      has_draft: (raw.id ?? null) !== null,
      planets_count: raw.count ?? 0,
    };
  } catch {
    return MOCK_CART;
  }
}

type BackendRouteJSON = {
  ID?: number;
  id?: number;
  Title?: string;
  title?: string;
  From?: string;
  from_body?: string;
  from?: string;
  To?: string;
  to_body?: string;
  to?: string;
  Description?: string;
  description?: string;
  Image?: string;
  image_url?: string;
  image?: string;
  Video?: string;
  video_url?: string;
  video?: string;
  FromOrbitKm?: number;
  from_orbit_radius_km?: number;
  ToOrbitKm?: number;
  to_orbit_radius_km?: number;
};

function kmToAu(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 1;
  return km / 149_597_870.7;
}

function adaptBackendRoute(raw: BackendRouteJSON): PlanetJSON {
  const fromOrbitKm = raw.FromOrbitKm ?? raw.from_orbit_radius_km ?? 149_597_870.7;
  const toOrbitKm = raw.ToOrbitKm ?? raw.to_orbit_radius_km ?? 149_597_870.7;
  return {
    planet_id: raw.ID ?? raw.id ?? 0,
    title: raw.Title ?? raw.title ?? "Маршрут",
    from: raw.From ?? raw.from_body ?? raw.from ?? "",
    to: raw.To ?? raw.to_body ?? raw.to ?? "",
    description: raw.Description ?? raw.description ?? "",
    image: raw.Image ?? raw.image_url ?? raw.image ?? "",
    video: raw.Video ?? raw.video_url ?? raw.video ?? "",
    from_orbit_au: kmToAu(fromOrbitKm),
    to_orbit_au: kmToAu(toOrbitKm),
    launch_date: "",
    price_credits: 0,
  };
}

export async function listPlanets(params?: {
  query?: string;
}): Promise<PlanetJSON[]> {
  const { filterMockPlanetsByQuery, PLANETS_MOCK } = await import("./modules/mock");
  try {
    let path = "/api/interplanetaryflights";
    const q = new URLSearchParams();
    if (params?.query?.trim()) q.append("query", params.query.trim());
    if (q.size > 0) path += `?${q.toString()}`;
    const res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = (await res.json()) as { items?: BackendRouteJSON[] } | BackendRouteJSON[];
    const items = Array.isArray(payload) ? payload : (payload.items ?? []);
    return items.map(adaptBackendRoute);
  } catch {
    const byQuery = filterMockPlanetsByQuery(params?.query ?? "");
    return byQuery.length > 0 ? byQuery : PLANETS_MOCK;
  }
}

export async function getPlanet(id: number): Promise<PlanetJSON | null> {
  const { getMockPlanet } = await import("./modules/mock");
  try {
    const res = await fetch(`/api/interplanetaryflights/${id}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as BackendRouteJSON;
    return adaptBackendRoute(raw);
  } catch {
    return getMockPlanet(id) ?? null;
  }
}

export async function getInterplanetaryFlightRequest(id: number): Promise<InterplanetaryFlightRequestDetailJSON | null> {
  const { cloneInterplanetaryFlightDetail, MOCK_INTERPLANETARY_FLIGHT_DETAIL } = await import("./modules/mock");
  try {
    const res = await fetch(`/api/interplanetaryflightrequests/${id}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as {
      id: number;
      spacecraft_dry_mass_kg: number;
      total_fuel_mass_kg?: number | null;
      items?: Array<{
        route_id: number;
        quantity: number;
        segment_order: number;
        is_primary: boolean;
        delta_v_ms: number;
        propellant_kg: number;
        interplanetary_flight_title: string;
        interplanetary_flight_from: string;
        interplanetary_flight_to: string;
        interplanetary_flight_description: string;
        image_url: string;
        video_url: string;
        from_orbit_radius_km?: number;
        to_orbit_radius_km?: number;
      }>;
    };

    const items = raw.items ?? [];
    const flights: PlanetInRequestRowJSON[] = items.map((it) => ({
      planet_id: it.route_id,
      segment_order: it.segment_order,
      quantity: it.quantity,
      is_primary: it.is_primary,
      delta_v_ms: it.delta_v_ms,
      propellant_kg: it.propellant_kg,
      planet: {
        planet_id: it.route_id,
        title: it.interplanetary_flight_title,
        from: it.interplanetary_flight_from,
        to: it.interplanetary_flight_to,
        description: it.interplanetary_flight_description,
        image: it.image_url,
        video: it.video_url,
        from_orbit_au: kmToAu(it.from_orbit_radius_km ?? 149_597_870.7),
        to_orbit_au: kmToAu(it.to_orbit_radius_km ?? 149_597_870.7),
        launch_date: "",
        price_credits: 0,
      },
    }));

    const totalDelta = flights.reduce((sum, r) => sum + r.delta_v_ms, 0);
    const totalFuel = flights.reduce((sum, r) => sum + r.propellant_kg, 0);

    return {
      interplanetary_flight_request_id: raw.id,
      title: `Заявка № ${raw.id}`,
      description: "Сформированная заявка на расчёт межпланетных перелётов.",
      route_count: flights.length,
      engine_mass_kg: 0,
      spacecraft_dry_mass_kg: raw.spacecraft_dry_mass_kg,
      total_delta_v_ms: totalDelta,
      total_fuel_mass_kg: raw.total_fuel_mass_kg ?? totalFuel,
      flights_in_request: flights,
    };
  } catch {
    if (id === MOCK_INTERPLANETARY_FLIGHT_DETAIL.interplanetary_flight_request_id) {
      return cloneInterplanetaryFlightDetail(MOCK_INTERPLANETARY_FLIGHT_DETAIL);
    }
    return null;
  }
}

const AU_METERS = 149_597_870_700;
const MU_SUN = 1.32712440018e20;
const G0 = 9.80665;

export function calculateHohmannDeltaVms(r1AU: number, r2AU: number): number {
  if (r1AU <= 0 || r2AU <= 0) return 0;
  const r1 = r1AU * AU_METERS;
  const r2 = r2AU * AU_METERS;
  const v1 = Math.sqrt(MU_SUN / r1);
  const v2 = Math.sqrt(MU_SUN / r2);
  const a = (r1 + r2) / 2;
  const vt1 = Math.sqrt(MU_SUN * (2 / r1 - 1 / a));
  const vt2 = Math.sqrt(MU_SUN * (2 / r2 - 1 / a));
  const dv1 = Math.abs(vt1 - v1);
  const dv2 = Math.abs(v2 - vt2);
  return dv1 + dv2;
}

export function calculatePropellantKg(dryMassKg: number, deltaVms: number, ispSeconds: number): number {
  if (dryMassKg <= 0 || deltaVms <= 0 || ispSeconds <= 0) return 0;
  return dryMassKg * (Math.exp(deltaVms / (ispSeconds * G0)) - 1);
}
