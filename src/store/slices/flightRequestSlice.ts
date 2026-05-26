import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api";
import type {
  WebBackendInternalAppSerializerFlightInRequestJSON,
  WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
  WebBackendInternalAppSerializerPlanetJSON,
} from "../../api/Api";
import type {
  InterplanetaryFlightRequestDetailJSON,
  PlanetInRequestRowJSON,
  PlanetJSON,
} from "../../cosmosApi";
import { planetVisualShortDescription } from "../../cosmosApi";
import { apiErrMessage } from "../utils/apiError";
import { clearSession } from "./userSlice";

const AU_KM = 149_597_870.7;

function kmToAu(km: number | undefined): number {
  if (km == null || !Number.isFinite(km) || km <= 0) return 1;
  return km / AU_KM;
}

function mapPlanet(p: WebBackendInternalAppSerializerPlanetJSON): PlanetJSON {
  const title = p.title ?? "Маршрут";
  return {
    planet_id: Number(p.planet_id ?? 0),
    title,
    from: p.from_body ?? "",
    to: p.to_body ?? "",
    description: p.description ?? "",
    image: p.image_url ?? "",
    video: p.video_url ?? "",
    from_orbit_au: kmToAu(p.from_orbit_radius_km),
    to_orbit_au: kmToAu(p.to_orbit_radius_km),
    launch_date: "",
    price_credits: 0,
    short_description_en: p.short_description_en ?? planetVisualShortDescription(title),
  };
}

function mapFlightRequestRow(
  fr: WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
): FlightRequestListRow {
  const requestId = Number(fr.interplanetary_flight_request_id ?? fr.id ?? 0);
  return {
    interplanetary_flight_request_id: requestId,
    status: fr.status ?? "",
    created_at: fr.created_at != null ? String(fr.created_at) : "",
    creator_login: fr.creator_login ?? "",
    moderator_login: fr.moderator_login ?? null,
    forming_date: fr.forming_date ?? fr.formed_at ?? null,
    finish_date: fr.finish_date ?? fr.completed_at ?? null,
    description: fr.description ?? fr.theme ?? null,
    theme: fr.theme ?? fr.description ?? null,
    spacecraft_dry_mass_kg: Number(fr.spacecraft_dry_mass_kg ?? 0),
    total_fuel_mass_kg: fr.total_fuel_mass_kg ?? null,
    route_count: Number(fr.routes_count ?? fr.route_count ?? 0),
    segments_with_result: Number(fr.segments_with_result ?? 0),
  };
}

export interface FlightRequestListRow {
  interplanetary_flight_request_id: number;
  status: string;
  created_at: string;
  creator_login: string;
  moderator_login: string | null;
  forming_date: string | null;
  finish_date: string | null;
  description: string | null;
  theme: string | null;
  spacecraft_dry_mass_kg: number;
  total_fuel_mass_kg: number | null;
  route_count: number;
  segments_with_result: number;
}

export interface FlightRequestDetail extends InterplanetaryFlightRequestDetailJSON {
  status: string;
  creator_login: string;
  moderator_login: string | null;
  forming_date: string | null;
  finish_date: string | null;
  created_at: string;
}

type BackendDetailItem = {
  planet_id?: number;
  route_id?: number;
  quantity?: number;
  segment_order?: number;
  is_primary?: boolean;
  delta_v_ms?: number;
  propellant_kg?: number;
  interplanetary_flight_title?: string;
  interplanetary_flight_from?: string;
  interplanetary_flight_to?: string;
  interplanetary_flight_description?: string;
  image_url?: string;
  video_url?: string;
  from_orbit_radius_km?: number;
  to_orbit_radius_km?: number;
  short_description_en?: string;
  segment_dry_mass_kg?: number;
  segment_isp_sec?: number;
  planet?: WebBackendInternalAppSerializerPlanetJSON;
};

function rowFromBackend(it: BackendDetailItem): PlanetInRequestRowJSON {
  const planetId = Number(it.planet_id ?? it.route_id ?? 0);
  const planet: PlanetJSON = it.planet
    ? mapPlanet(it.planet)
    : {
        planet_id: planetId,
        title: it.interplanetary_flight_title ?? "Маршрут",
        from: it.interplanetary_flight_from ?? "",
        to: it.interplanetary_flight_to ?? "",
        description: it.interplanetary_flight_description ?? "",
        image: it.image_url ?? "",
        video: it.video_url ?? "",
        from_orbit_au: kmToAu(it.from_orbit_radius_km),
        to_orbit_au: kmToAu(it.to_orbit_radius_km),
        launch_date: "",
        price_credits: 0,
        short_description_en:
          it.short_description_en ??
          planetVisualShortDescription(it.interplanetary_flight_title ?? ""),
      };
  return {
    planet_id: planetId,
    segment_order: Number(it.segment_order ?? 0),
    quantity: Number(it.quantity ?? 1),
    is_primary: Boolean(it.is_primary),
    delta_v_ms: Number(it.delta_v_ms ?? 0),
    propellant_kg: Number(it.propellant_kg ?? 0),
    segment_dry_mass_kg:
      it.segment_dry_mass_kg != null ? Number(it.segment_dry_mass_kg) : undefined,
    segment_isp_sec: it.segment_isp_sec != null ? Number(it.segment_isp_sec) : undefined,
    planet,
  };
}

function asDetail(data: unknown): FlightRequestDetail | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const headerRaw = (o.interplanetary_flight_request ?? o.system_load ?? o) as
    | WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON
    | undefined;
  const itemsRaw = (o.items ?? o.flights_in_request ?? o.routes ?? []) as BackendDetailItem[];
  if (!headerRaw || typeof headerRaw !== "object") return null;
  const flights = (Array.isArray(itemsRaw) ? itemsRaw : []).map(rowFromBackend);
  const totalDv = flights.reduce((s, r) => s + r.delta_v_ms, 0);
  const totalFuel = flights.reduce((s, r) => s + r.propellant_kg, 0);
  const id = Number(
    headerRaw.interplanetary_flight_request_id ??
      (o.id as number | undefined) ??
      0,
  );
  return {
    interplanetary_flight_request_id: id,
    title: "Заявка на расчёт",
    description: headerRaw.description ?? headerRaw.theme ?? "",
    route_count: flights.length,
    engine_mass_kg: 0,
    spacecraft_dry_mass_kg: Number(headerRaw.spacecraft_dry_mass_kg ?? 0),
    total_delta_v_ms: totalDv,
    total_fuel_mass_kg: headerRaw.total_fuel_mass_kg ?? totalFuel,
    flights_in_request: flights,
    status: headerRaw.status ?? "draft",
    creator_login: headerRaw.creator_login ?? "",
    moderator_login: headerRaw.moderator_login ?? null,
    forming_date: headerRaw.forming_date ?? null,
    finish_date: headerRaw.finish_date ?? null,
    created_at: headerRaw.created_at != null ? String(headerRaw.created_at) : "",
  };
}

function defaultListFilters() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const day = `${y}-${m}-${d}`;
  return { fromDate: day, toDate: day, status: "" };
}

export interface FlightRequestCart {
  has_draft: boolean;
  planets_count: number;
  id?: number;
}

function buildInitialState() {
  return {
    cart: null as FlightRequestCart | null,
    cartLoading: false,
    detail: null as FlightRequestDetail | null,
    detailLoading: false,
    detailError: null as string | null,
    list: [] as FlightRequestListRow[],
    listLoading: false,
    listError: null as string | null,
    filters: defaultListFilters(),
    itemMutationLoading: {} as Record<string, boolean>,
    applicationMutationLoading: false,
  };
}

type CartSliceUser = { user: { isAuthenticated: boolean } };

function emptyGuestCartPayload(): FlightRequestCart {
  return {
    has_draft: false,
    planets_count: 0,
    id: undefined,
  };
}

function axiosStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

export const fetchFlightRequestCart = createAsyncThunk(
  "flightRequest/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const before = getState() as CartSliceUser;
    if (!before.user.isAuthenticated) {
      return emptyGuestCartPayload();
    }
    try {
      const r = await api.interplanetaryFlights.interplanetaryFlightRequestCartList();
      const after = getState() as CartSliceUser;
      if (!after.user.isAuthenticated) {
        return emptyGuestCartPayload();
      }
      const d = r.data as Record<string, unknown>;
      const planetsCount = Number(
        d.planets_count ?? d.strategies_count ?? d.count ?? 0,
      );
      const rawId = d.id;
      return {
        has_draft: Boolean(d.has_draft ?? (rawId != null && rawId !== 0)),
        planets_count: planetsCount,
        id: typeof rawId === "number" ? rawId : undefined,
      } satisfies FlightRequestCart;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchFlightRequestDetail = createAsyncThunk(
  "flightRequest/fetchDetail",
  async (applicationId: number, { rejectWithValue }) => {
    try {
      const r = await api.interplanetaryFlights.interplanetaryFlightRequestDetail(
        applicationId,
      );
      const detail = asDetail(r.data);
      if (!detail) return rejectWithValue("Неверный ответ сервера");
      return detail;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const addPlanetToFlightRequest = createAsyncThunk(
  "flightRequest/addPlanetLine",
  async (planetId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.planetsInFlights.addPlanetToFlightRequestDraft({
        route_id: planetId,
      });
      await dispatch(fetchFlightRequestCart());
      return planetId;
    } catch (e) {
      if (axiosStatus(e) === 409) {
        await dispatch(fetchFlightRequestCart());
        return planetId;
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateFlightInRequestLine = createAsyncThunk(
  "flightRequest/updateFlightInRequestLine",
  async (
    {
      planetId,
      flightRequestId,
      body,
    }: {
      planetId: number;
      flightRequestId: number;
      body: WebBackendInternalAppSerializerFlightInRequestJSON;
    },
    { rejectWithValue, dispatch },
  ) => {
    const key = `${planetId}-${flightRequestId}`;
    try {
      await api.planetsInFlights.updateFlightInRequestLine(
        planetId,
        flightRequestId,
        body,
      );
      await dispatch(fetchFlightRequestDetail(flightRequestId));
      return key;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const removeFlightInRequestLine = createAsyncThunk(
  "flightRequest/removeFlightInRequestLine",
  async (
    { planetId, flightRequestId }: { planetId: number; flightRequestId: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.planetsInFlights.deleteFlightInRequestLine(planetId, flightRequestId);
      await dispatch(fetchFlightRequestDetail(flightRequestId));
      await dispatch(fetchFlightRequestCart());
      return planetId;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateFlightRequestDraft = createAsyncThunk(
  "flightRequest/updateApplicationDraft",
  async (
    {
      applicationId,
      body,
    }: {
      applicationId: number;
      body: WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.interplanetaryFlights.editInterplanetaryFlightRequestUpdate(
        applicationId,
        body,
      );
      await dispatch(fetchFlightRequestDetail(applicationId));
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const formFlightRequest = createAsyncThunk(
  "flightRequest/form",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.interplanetaryFlights.formInterplanetaryFlightRequestUpdate(
        applicationId,
      );
      await dispatch(fetchFlightRequestDetail(applicationId));
      await dispatch(fetchFlightRequestCart());
      await dispatch(fetchFlightRequestsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const deleteFlightRequest = createAsyncThunk(
  "flightRequest/deleteApplication",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.interplanetaryFlights.deleteInterplanetaryFlightRequestDelete(
        applicationId,
      );
      await dispatch(fetchFlightRequestCart());
      await dispatch(fetchFlightRequestsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const finishFlightRequest = createAsyncThunk(
  "flightRequest/finish",
  async (
    { applicationId, status }: { applicationId: number; status: "completed" | "rejected" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.interplanetaryFlights.moderateInterplanetaryFlightRequestUpdate(
        applicationId,
        { action: status === "completed" ? "complete" : "reject" },
      );
      await dispatch(fetchFlightRequestsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchFlightRequestsList = createAsyncThunk(
  "flightRequest/fetchList",
  async (_, { getState, rejectWithValue }) => {
    try {
      const st = getState() as {
        flightRequest: { filters: ReturnType<typeof defaultListFilters> };
      };
      const f = st.flightRequest.filters;
      const query: { from?: string; to?: string; status?: string } = {};
      if (f.fromDate) query.from = `${f.fromDate}T00:00:00Z`;
      if (f.toDate) query.to = `${f.toDate}T23:59:59Z`;
      if (f.status) query.status = f.status;
      const r =
        await api.interplanetaryFlights.allInterplanetaryFlightRequestsList(
          query,
        );
      const payload = r.data as
        | WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON[]
        | { items?: WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON[] };
      const rows = Array.isArray(payload) ? payload : (payload.items ?? []);
      return rows.map(mapFlightRequestRow);
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

const flightRequestSlice = createSlice({
  name: "flightRequest",
  initialState: buildInitialState(),
  reducers: {
    clearFlightRequestDetailError: (state) => {
      state.detailError = null;
    },
    setListFilters: (
      state,
      action: PayloadAction<Partial<ReturnType<typeof defaultListFilters>>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetListFiltersToToday: (state) => {
      state.filters = defaultListFilters();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearSession, () => buildInitialState())
      .addCase(fetchFlightRequestCart.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchFlightRequestCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchFlightRequestCart.rejected, (state) => {
        state.cartLoading = false;
        state.cart = {
          has_draft: false,
          planets_count: 0,
        };
      })
      .addCase(fetchFlightRequestDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchFlightRequestDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchFlightRequestDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchFlightRequestsList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchFlightRequestsList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchFlightRequestsList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      .addCase(addPlanetToFlightRequest.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(addPlanetToFlightRequest.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(addPlanetToFlightRequest.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateFlightRequestDraft.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(updateFlightRequestDraft.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateFlightRequestDraft.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formFlightRequest.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(formFlightRequest.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formFlightRequest.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(deleteFlightRequest.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(deleteFlightRequest.fulfilled, (state) => {
        state.applicationMutationLoading = false;
        state.detail = null;
      })
      .addCase(deleteFlightRequest.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateFlightInRequestLine.pending, (state, action) => {
        const k = `${action.meta.arg.planetId}-${action.meta.arg.flightRequestId}`;
        state.itemMutationLoading[`line-${k}`] = true;
      })
      .addCase(updateFlightInRequestLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`line-${action.payload}`];
      })
      .addCase(updateFlightInRequestLine.rejected, (state, action) => {
        const arg = action.meta?.arg;
        if (arg)
          delete state.itemMutationLoading[`line-${arg.planetId}-${arg.flightRequestId}`];
      })
      .addCase(removeFlightInRequestLine.pending, (state, action) => {
        const id = action.meta.arg.planetId;
        state.itemMutationLoading[`rm-${id}`] = true;
      })
      .addCase(removeFlightInRequestLine.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(removeFlightInRequestLine.rejected, (state, action) => {
        const id = action.meta?.arg?.planetId;
        if (id != null) delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(finishFlightRequest.pending, (state, action) => {
        const id = action.meta.arg.applicationId;
        state.itemMutationLoading[`finish-${id}`] = true;
      })
      .addCase(finishFlightRequest.fulfilled, (state, action) => {
        const id = action.meta.arg.applicationId;
        delete state.itemMutationLoading[`finish-${id}`];
      })
      .addCase(finishFlightRequest.rejected, (state, action) => {
        const id = action.meta?.arg?.applicationId;
        if (id != null) delete state.itemMutationLoading[`finish-${id}`];
      });
  },
});

export const {
  clearFlightRequestDetailError,
  setListFilters,
  resetListFiltersToToday,
} = flightRequestSlice.actions;
export default flightRequestSlice.reducer;
