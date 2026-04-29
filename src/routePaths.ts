export const ROUTES = {
  PLANETS: "/",
  PLANET: "/planet/:id",
  MISSION: "/mission/:id",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  PLANETS: "Каталог планет",
  PLANET: "Планета",
  MISSION: "Заявка",
};
