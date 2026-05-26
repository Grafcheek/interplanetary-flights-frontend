import { generatePath } from "react-router-dom";

export const ROUTES = {
  PLANETS: "/planets",
  PLANET: "/planets/:id",
  INTERPLANETARY_FLIGHTS: "/interplanetary_flights",
  INTERPLANETARY_FLIGHT: "/interplanetary_flights/:id",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  PROFILE: "/profile",
  GUEST_INFO: "/info",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  PLANETS: "Каталог планет",
  PLANET: "Планета",
  INTERPLANETARY_FLIGHTS: "Заявки",
  INTERPLANETARY_FLIGHT: "Заявка",
  SIGN_IN: "Вход",
  SIGN_UP: "Регистрация",
  PROFILE: "Личный кабинет",
  GUEST_INFO: "О приложении",
};

export function planetPath(id: string | number): string {
  return generatePath(ROUTES.PLANET, { id: String(id) });
}

export function interplanetaryFlightPath(id: string | number): string {
  return generatePath(ROUTES.INTERPLANETARY_FLIGHT, { id: String(id) });
}
