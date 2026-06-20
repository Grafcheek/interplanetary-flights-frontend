export const PLANETS_FILTERS_RESET_EVENT = "cosmos:planets-filters-reset";

export function dispatchPlanetsFiltersReset(): void {
  window.dispatchEvent(new Event(PLANETS_FILTERS_RESET_EVENT));
}
