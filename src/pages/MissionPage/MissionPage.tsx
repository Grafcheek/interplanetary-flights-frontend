import { useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router-dom";
import { cloneInterplanetaryFlightDetail, MOCK_INTERPLANETARY_FLIGHT_DETAIL } from "../../modules/mock";
import {
  calculateHohmannDeltaVms,
  calculatePropellantKg,
  fallbackImageUrl,
  resolveMediaUrl,
  type PlanetInRequestRowJSON,
} from "../../cosmosApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  deleteFlightRequest,
  fetchFlightRequestDetail,
  type FlightRequestDetail,
  formFlightRequest,
  removeFlightInRequestLine,
  updateFlightInRequestLine,
  updateFlightRequestDraft,
} from "../../store/slices/flightRequestSlice";
import { ROUTES } from "../../routePaths";

const REQUEST_TITLE = "Заявка на расчёт";
const DEFAULT_ISP_SEC = 320;
const DEFAULT_MASS_KG = 2000;

type RowEdit = {
  segment_dry_mass_kg: number;
  segment_isp_sec: number;
};

function rowMetrics(row: PlanetInRequestRowJSON, massKg: number, ispSec: number) {
  const delta_v_ms = calculateHohmannDeltaVms(row.planet.from_orbit_au, row.planet.to_orbit_au);
  const propellant_kg = calculatePropellantKg(massKg, delta_v_ms, ispSec);
  return { delta_v_ms, propellant_kg };
}

function buildMockDetail(id: number): FlightRequestDetail | null {
  if (id !== MOCK_INTERPLANETARY_FLIGHT_DETAIL.interplanetary_flight_request_id) return null;
  const base = cloneInterplanetaryFlightDetail(MOCK_INTERPLANETARY_FLIGHT_DETAIL);
  return {
    ...base,
    title: REQUEST_TITLE,
    status: "draft",
    creator_login: "demo",
    moderator_login: null,
    forming_date: null,
    finish_date: null,
    created_at: new Date().toISOString(),
  };
}

function buildRowEdits(data: FlightRequestDetail): Record<number, RowEdit> {
  const defaultMass =
    data.spacecraft_dry_mass_kg > 0 ? data.spacecraft_dry_mass_kg : DEFAULT_MASS_KG;
  const next: Record<number, RowEdit> = {};
  for (const row of data.flights_in_request) {
    next[row.planet_id] = {
      segment_dry_mass_kg:
        row.segment_dry_mass_kg != null && row.segment_dry_mass_kg > 0
          ? row.segment_dry_mass_kg
          : defaultMass,
      segment_isp_sec:
        row.segment_isp_sec != null && row.segment_isp_sec > 0
          ? row.segment_isp_sec
          : DEFAULT_ISP_SEC,
    };
  }
  return next;
}

export default function MissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { detail, detailLoading, detailError, applicationMutationLoading, itemMutationLoading } =
    useAppSelector((s) => s.flightRequest);

  const [mockData, setMockData] = useState<FlightRequestDetail | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [rowEdits, setRowEdits] = useState<Record<number, RowEdit>>({});

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    setMockData(null);
    void dispatch(fetchFlightRequestDetail(Number(id))).then((a) => {
      if (fetchFlightRequestDetail.rejected.match(a)) {
        setMockData(buildMockDetail(Number(id)));
      }
    });
  }, [id, isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data: FlightRequestDetail | null = detail ?? mockData;

  const rowsKey =
    data?.flights_in_request.map((r) => `${r.planet_id}:${r.segment_order}`).join("|") ?? "";

  useEffect(() => {
    if (!data) return;
    setDescriptionDraft(data.description ?? "");
  }, [data?.interplanetary_flight_request_id, data?.description]);

  useEffect(() => {
    if (!data) return;
    setRowEdits(buildRowEdits(data));
  }, [data?.interplanetary_flight_request_id, rowsKey]);

  const applicationId = data?.interplanetary_flight_request_id;
  const isDraft = data?.status === "draft";
  const canEditDraft = Boolean(isDraft && !isModerator);
  const busy = applicationMutationLoading || detailLoading;

  const lineBusy = (planetId: number) =>
    Boolean(itemMutationLoading[`line-${planetId}-${applicationId ?? 0}`]);
  const rmBusy = (planetId: number) => Boolean(itemMutationLoading[`rm-${planetId}`]);

  const getRowEdit = useCallback(
    (row: PlanetInRequestRowJSON): RowEdit => {
      const cached = rowEdits[row.planet_id];
      if (cached) return cached;
      const defaultMass =
        data && data.spacecraft_dry_mass_kg > 0 ? data.spacecraft_dry_mass_kg : DEFAULT_MASS_KG;
      return {
        segment_dry_mass_kg:
          row.segment_dry_mass_kg != null && row.segment_dry_mass_kg > 0
            ? row.segment_dry_mass_kg
            : defaultMass,
        segment_isp_sec:
          row.segment_isp_sec != null && row.segment_isp_sec > 0
            ? row.segment_isp_sec
            : DEFAULT_ISP_SEC,
      };
    },
    [rowEdits, data],
  );

  const handleMassChange = (row: PlanetInRequestRowJSON, raw: string) => {
    const mass = Math.max(0, Number(raw) || 0);
    const edit = getRowEdit(row);
    const nextEdit: RowEdit = { ...edit, segment_dry_mass_kg: mass };
    setRowEdits((prev) => ({ ...prev, [row.planet_id]: nextEdit }));

    if (mockData) {
      const { delta_v_ms, propellant_kg } = rowMetrics(row, mass, nextEdit.segment_isp_sec);
      setMockData((prev) => {
        if (!prev) return prev;
        const flights = prev.flights_in_request.map((r) =>
          r.planet_id === row.planet_id
            ? {
                ...r,
                segment_dry_mass_kg: mass,
                delta_v_ms,
                propellant_kg,
              }
            : r,
        );
        return {
          ...prev,
          flights_in_request: flights,
          total_delta_v_ms: flights.reduce((s, r) => s + r.delta_v_ms, 0),
          total_fuel_mass_kg: flights.reduce((s, r) => s + r.propellant_kg, 0),
        };
      });
    }
  };

  const handleSaveDescription = () => {
    if (!applicationId || !canEditDraft || mockData) return;
    void dispatch(
      updateFlightRequestDraft({
        applicationId,
        body: { theme: descriptionDraft || null, description: descriptionDraft || null },
      }),
    );
  };

  const handleSaveRow = (row: PlanetInRequestRowJSON) => {
    if (!applicationId || !canEditDraft) return;
    const edit = getRowEdit(row);
    if (mockData) return;
    void dispatch(
      updateFlightInRequestLine({
        planetId: row.planet_id,
        flightRequestId: applicationId,
        body: {
          quantity: row.quantity,
          segment_order: row.segment_order,
          segment_dry_mass_kg: edit.segment_dry_mass_kg,
          segment_isp_sec: edit.segment_isp_sec,
        },
      }),
    );
  };

  const handleRemoveRow = (planetId: number) => {
    if (!applicationId || !canEditDraft || mockData) return;
    if (!window.confirm("Убрать маршрут из заявки?")) return;
    void dispatch(removeFlightInRequestLine({ planetId, flightRequestId: applicationId }));
  };

  const handleForm = () => {
    if (!applicationId || !canEditDraft || mockData) return;
    void dispatch(formFlightRequest(applicationId));
  };

  const handleDeleteApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !canEditDraft) return;
    if (!window.confirm("Удалить заявку?")) return;
    if (mockData) {
      navigate(ROUTES.PLANETS, { replace: true });
      return;
    }
    void dispatch(deleteFlightRequest(applicationId)).then(() => {
      navigate(ROUTES.PLANETS, { replace: true });
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (detailLoading && !data) {
    return (
      <div className="mission-page">
        <div className="planets-page__loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!data || applicationId == null) {
    return (
      <div className="mission-page">
        <div className="mission-not-found">
          <h1>{detailError ? detailError : "Заявка не найдена."}</h1>
        </div>
      </div>
    );
  }

  const sortedRows = [...data.flights_in_request].sort(
    (a, b) => a.segment_order - b.segment_order,
  );

  return (
    <div className="mission-page">
      {busy ? (
        <div className="mission-page__blocking" aria-live="polite">
          <Spinner animation="border" size="sm" /> Обработка…
        </div>
      ) : null}
      <div className={`system-load-detail ${busy ? "mission-detail--blocked" : ""}`}>
        <div className="system-load-detail__header-card">
          <h1 className="system-load-detail__title">{REQUEST_TITLE}</h1>
          <div className="system-load-detail__info">
            <div className="system-load-detail__info-item">
              <strong>ID заявки:</strong> {applicationId}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Маршрутов в заявке:</strong> {data.flights_in_request.length}
            </div>
          </div>
          <Form.Group className="mission-page__description" controlId="mission-description">
            <Form.Label>Тема заявки</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Кратко опишите тему межпланетной миссии…"
              disabled={!canEditDraft || Boolean(mockData)}
            />
          </Form.Group>
          {canEditDraft && !mockData ? (
            <div className="mission-page__method-actions">
              <button
                type="button"
                className="mission-page__method-btn"
                disabled={busy}
                onClick={() => handleSaveDescription()}
              >
                Сохранить тему
              </button>
              <button
                type="button"
                className="mission-page__method-btn mission-page__method-btn--accent"
                disabled={busy}
                onClick={() => handleForm()}
              >
                Сформировать заявку
              </button>
            </div>
          ) : null}
        </div>

        <table className="load-table">
          <thead>
            <tr>
              <th className="load-table__col-photo">Фото</th>
              <th>Маршрут</th>
              <th>Откуда</th>
              <th>Куда</th>
              <th>Масса, кг</th>
              <th>Δv (м/с)</th>
              <th>Топливо (кг)</th>
              {canEditDraft ? <th>Действия</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const photo = resolveMediaUrl(row.planet.image) || fallbackImageUrl();
              const edit = getRowEdit(row);
              const { delta_v_ms, propellant_kg } = rowMetrics(
                row,
                edit.segment_dry_mass_kg,
                edit.segment_isp_sec,
              );
              return (
                <tr key={`${applicationId}-${row.planet_id}`}>
                  <td className="load-table__col-photo">
                    <img src={photo} alt={row.planet.title} />
                  </td>
                  <td>{row.planet.title}</td>
                  <td>{row.planet.from}</td>
                  <td>{row.planet.to}</td>
                  <td>
                    <Form.Control
                      type="number"
                      className="load-table__input"
                      min={1}
                      step={1}
                      value={edit.segment_dry_mass_kg}
                      disabled={!canEditDraft}
                      onChange={(e) => handleMassChange(row, e.target.value)}
                    />
                  </td>
                  <td>{Math.round(delta_v_ms)}</td>
                  <td>{Math.round(propellant_kg)}</td>
                  {canEditDraft ? (
                    <td className="load-table__actions">
                      <div className="load-table__actions-inner">
                        <button
                          type="button"
                          className="mission-page__row-btn"
                          disabled={busy || lineBusy(row.planet_id) || Boolean(mockData)}
                          onClick={() => handleSaveRow(row)}
                        >
                          Сохранить перелёт
                        </button>
                        <button
                          type="button"
                          className="mission-page__row-btn mission-page__row-btn--danger"
                          disabled={busy || rmBusy(row.planet_id) || Boolean(mockData)}
                          onClick={() => handleRemoveRow(row.planet_id)}
                        >
                          Удалить из заявки
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>

        {canEditDraft ? (
          <form className="mission-page__delete-form" onSubmit={handleDeleteApplication}>
            <button
              type="submit"
              className="mission-page__delete-btn"
              disabled={busy || Boolean(mockData)}
            >
              Удалить заявку
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
