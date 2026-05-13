import axios from "axios";
import type { PlanetJSON } from "../cosmosApi";
import { planetVisualShortDescription } from "../cosmosApi";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * Каталог межпланетных перелётов («услуги»): только axios, без swagger-клиента —
 * как требует задание лаб. 7 (услуги и авторизация — отдельный axios).
 */
export const planetsAxios = axios.create({
  baseURL,
});

planetsAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type BackendPlanetJSON = {
  ID?: number;
  id?: number;
  planet_id?: number;
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
  ShortDescriptionEn?: string;
  short_description_en?: string;
};

function kmToAu(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 1;
  return km / 149_597_870.7;
}

function adaptBackendPlanet(raw: BackendPlanetJSON): PlanetJSON {
  const fromOrbitKm = raw.FromOrbitKm ?? raw.from_orbit_radius_km ?? 149_597_870.7;
  const toOrbitKm = raw.ToOrbitKm ?? raw.to_orbit_radius_km ?? 149_597_870.7;
  const title = raw.Title ?? raw.title ?? "Маршрут";
  return {
    planet_id: raw.ID ?? raw.id ?? raw.planet_id ?? 0,
    title,
    from: raw.From ?? raw.from_body ?? raw.from ?? "",
    to: raw.To ?? raw.to_body ?? raw.to ?? "",
    description: raw.Description ?? raw.description ?? "",
    image: raw.Image ?? raw.image_url ?? raw.image ?? "",
    video: raw.Video ?? raw.video_url ?? raw.video ?? "",
    from_orbit_au: kmToAu(fromOrbitKm),
    to_orbit_au: kmToAu(toOrbitKm),
    launch_date: "",
    price_credits: 0,
    short_description_en:
      raw.ShortDescriptionEn ?? raw.short_description_en ?? planetVisualShortDescription(title),
  };
}

export async function listPlanetsAxios(params?: { query?: string }): Promise<PlanetJSON[]> {
  try {
    const r = await planetsAxios.get<{ items?: BackendPlanetJSON[] } | BackendPlanetJSON[]>(
      "/interplanetaryflights",
      {
        params: params?.query?.trim() ? { query: params.query.trim() } : undefined,
        headers: { Accept: "application/json" },
      },
    );
    const payload = r.data;
    const items = Array.isArray(payload) ? payload : (payload.items ?? []);
    return items.map(adaptBackendPlanet);
  } catch {
    return [];
  }
}

export async function getPlanetAxios(id: number): Promise<PlanetJSON | null> {
  try {
    const r = await planetsAxios.get<BackendPlanetJSON>(`/interplanetaryflights/${id}`, {
      headers: { Accept: "application/json" },
    });
    return r.data ? adaptBackendPlanet(r.data) : null;
  } catch {
    return null;
  }
}
