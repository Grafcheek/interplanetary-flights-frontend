import type { PlanetJSON } from "../../cosmosApi";
import type { PlanetSearchParams } from "../../types/llmTypes";

const PLANET_BY_KEY: Record<string, string> = {
  юпитер: "Юпитер",
  сатурн: "Сатурн",
  уран: "Уран",
  нептун: "Нептун",
  земля: "Земля",
  марс: "Марс",
};

const SEMANTIC_PLANET_RULES: { pattern: RegExp; planet: string }[] = [
  { pattern: /газов(?:ый|ому|ого|ая|ые)?(?:\s*гигант)?|полосат/i, planet: "Юпитер" },
  { pattern: /кольц|кольцев/i, planet: "Сатурн" },
  { pattern: /ледян(?:ой|ому|ого|ая|ые)?(?:\s*гигант)?/i, planet: "Уран" },
  { pattern: /нептун/i, planet: "Нептун" },
  { pattern: /уран/i, planet: "Уран" },
  { pattern: /сатурн/i, planet: "Сатурн" },
];

function planetHaystack(planet: PlanetJSON): string {
  return [planet.title, planet.from, planet.to, planet.description, planet.short_description_en ?? ""]
    .join(" ")
    .toLowerCase();
}

function tokenMatchesHaystack(haystack: string, token: string): boolean {
  const t = token.toLowerCase();
  if (t.length < 3) return haystack.includes(t);
  if (haystack.includes(t)) return true;
  const stem = t.slice(0, Math.min(5, t.length));
  return stem.length >= 3 && haystack.includes(stem);
}

/** «газовый гигант» → Юпитер и т.п. */
export function resolveSemanticPlanet(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const { pattern, planet } of SEMANTIC_PLANET_RULES) {
    if (pattern.test(lower)) return planet;
  }
  return planetNameInText(text);
}

/** Для API: синонимы → имя планеты, иначе исходная строка. */
export function expandSearchQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  return resolveSemanticPlanet(trimmed) ?? trimmed;
}

export function planetMatchesQuery(planet: PlanetJSON, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const semantic = resolveSemanticPlanet(q);
  if (semantic) {
    const s = semantic.toLowerCase();
    const haystack = planetHaystack(planet);
    return (
      planet.title.toLowerCase().includes(s) ||
      planet.to.toLowerCase().includes(s) ||
      planet.from.toLowerCase().includes(s) ||
      haystack.includes(s)
    );
  }

  const haystack = planetHaystack(planet);
  const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (tokens.length === 0) return haystack.includes(q.toLowerCase());
  return tokens.every((token) => tokenMatchesHaystack(haystack, token));
}

function planetNameInText(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [key, name] of Object.entries(PLANET_BY_KEY)) {
    if (lower.includes(key)) return name;
  }
  return undefined;
}

function destinationFromUserText(userText: string): string | undefined {
  const semantic = resolveSemanticPlanet(userText);
  if (semantic) return semantic;

  const match = userText.match(/(?:на|к|до)\s+([а-яё\s]+)/i);
  if (match) {
    const phrase = match[1].trim();
    return resolveSemanticPlanet(phrase) ?? PLANET_BY_KEY[phrase.split(/\s+/).pop()?.toLowerCase() ?? ""];
  }
  return planetNameInText(userText);
}

/** Подправляет типичные ошибки маленькой модели по исходной фразе пользователя. */
export function normalizePlanetSearchParams(
  params: PlanetSearchParams,
  userText: string,
): PlanetSearchParams {
  const normalized: PlanetSearchParams = { ...params };
  const dest =
    destinationFromUserText(userText) ??
    resolveSemanticPlanet(params.query ?? "") ??
    planetNameInText(params.query ?? "");
  const originMatch = userText.match(/(?:с|от)\s+([а-яё]+)/i);
  const origin = originMatch ? PLANET_BY_KEY[originMatch[1].toLowerCase()] : undefined;

  if (dest) {
    normalized.query = dest;
    if (!normalized.to_body || normalized.to_body !== dest) {
      normalized.to_body = dest;
    }
  }

  if (origin) {
    normalized.from_body = origin;
  }

  return normalized;
}

export function parsePlanetSearchJson(raw: string): PlanetSearchParams {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON не найден в ответе модели");
  }

  const parsed = JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;

  const pick = (key: keyof PlanetSearchParams): string | undefined => {
    const value = parsed[key];
    if (typeof value !== "string") return undefined;
    const s = value.trim();
    return s || undefined;
  };

  return {
    query: pick("query"),
    title: pick("title"),
    from_body: pick("from_body"),
    to_body: pick("to_body"),
  };
}

/** Строка query для GET /api/interplanetaryflights?query=... */
export function buildBackendQuery(params: PlanetSearchParams): string {
  const raw =
    params.query?.trim() ||
    params.title?.trim() ||
    [params.from_body, params.to_body].filter(Boolean).join(" ").trim();
  return expandSearchQuery(raw);
}

export function applyPlanetSearchFilters(
  planets: PlanetJSON[],
  params: PlanetSearchParams,
): PlanetJSON[] {
  let result = planets;

  if (params.title?.trim()) {
    const t = params.title.trim().toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(t));
  }
  if (params.from_body?.trim()) {
    const f = params.from_body.trim().toLowerCase();
    result = result.filter((p) => p.from.toLowerCase().includes(f));
  }
  if (params.to_body?.trim()) {
    const to = params.to_body.trim().toLowerCase();
    result = result.filter((p) => p.to.toLowerCase().includes(to));
  }

  if (result.length === 0 && params.query?.trim()) {
    return planets.filter((p) => planetMatchesQuery(p, params.query!));
  }

  return result;
}
