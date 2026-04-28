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
  id: number;
  has_draft: boolean;
  planets_count: number;
};

function minioBase(): string {
  const raw = import.meta.env.VITE_MINIO_BASE as string | undefined;
  return raw?.replace(/\/$/, "") ?? "";
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
