import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const FILTER_STORAGE_KEY = "planet_filter_state_v1";

type PlanetFilterState = {
  query: string;
  appliedQuery: string;
};

function readInitialState(): PlanetFilterState {
  if (typeof window === "undefined") {
    return { query: "", appliedQuery: "" };
  }

  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return { query: "", appliedQuery: "" };
    const parsed = JSON.parse(raw) as Partial<PlanetFilterState>;
    return {
      query: typeof parsed.query === "string" ? parsed.query : "",
      appliedQuery: typeof parsed.appliedQuery === "string" ? parsed.appliedQuery : "",
    };
  } catch {
    return { query: "", appliedQuery: "" };
  }
}

function persistState(state: PlanetFilterState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
}

const initialState: PlanetFilterState = readInitialState();

const planetFilterSlice = createSlice({
  name: "planetFilter",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
      persistState(state);
    },
    applyQuery(state) {
      state.appliedQuery = state.query;
      persistState(state);
    },
    resetQuery(state) {
      state.query = "";
      state.appliedQuery = "";
      persistState(state);
    },
  },
});

export const { setQuery, applyQuery, resetQuery } = planetFilterSlice.actions;
export default planetFilterSlice.reducer;
