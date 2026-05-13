import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router-dom";
import { cloneInterplanetaryFlightDetail, MOCK_INTERPLANETARY_FLIGHT_DETAIL } from "../../modules/mock";
import {
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

function buildMockDetail(id: number): FlightRequestDetail | null {
  if (id !== MOCK_INTERPLANETARY_FLIGHT_DETAIL.interplanetary_flight_request_id) return null;
  const base = cloneInterplanetaryFlightDetail(MOCK_INTERPLANETARY_FLIGHT_DETAIL);
  return {
    ...base,
    status: "draft",
    creator_login: "demo",
    moderator_login: null,
    forming_date: null,
    finish_date: null,
    created_at: new Date().toISOString(),
  };
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

  useEffect(() => {
    if (!data) return;
    setDescriptionDraft(data.description ?? "");
  }, [data]);

  const applicationId = data?.interplanetary_flight_request_id;
  const isDraft = data?.status === "draft";
  const canEditDraft = Boolean(isDraft && !isModerator);
  const busy = applicationMutationLoading || detailLoading;

  const lineBusy = (planetId: number) =>
    Boolean(itemMutationLoading[`line-${planetId}-${applicationId ?? 0}`]);
  const rmBusy = (planetId: number) => Boolean(itemMutationLoading[`rm-${planetId}`]);

  const handleSaveDescription = () => {
    if (!applicationId || !canEditDraft || mockData) return;
    void dispatch(
      updateFlightRequestDraft({
        applicationId,
        body: { description: descriptionDraft || null },
      }),
    );
  };

  const handleSaveRow = (row: PlanetInRequestRowJSON) => {
    if (!applicationId || !canEditDraft || mockData) return;
    void dispatch(
      updateFlightInRequestLine({
        planetId: row.planet_id,
        flightRequestId: applicationId,
        body: {
          quantity: row.quantity,
          segment_order: row.segment_order,
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
          <h1 className="system-load-detail__title">{data.title}</h1>
          <div className="system-load-detail__info">
            <div className="system-load-detail__info-item">
              <strong>ID заявки:</strong> {applicationId}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Статус:</strong> {data.status}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Создатель:</strong> {data.creator_login || "—"}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Маршрутов в заявке:</strong> {data.flights_in_request.length}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Суммарное Δv (м/с):</strong> {Math.round(data.total_delta_v_ms)}
            </div>
            <div className="system-load-detail__info-item">
              <strong>Суммарное топливо (кг):</strong>{" "}
              {Math.round(data.total_fuel_mass_kg ?? 0)}
            </div>
          </div>
          <Form.Group className="mission-page__description" controlId="mission-description">
            <Form.Label>Описание заявки</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Кратко опишите цель межпланетной миссии…"
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
                Сохранить описание
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
              <th>Δv (м/с)</th>
              <th>Топливо (кг)</th>
              {canEditDraft ? <th>Действия</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const photo = resolveMediaUrl(row.planet.image) || fallbackImageUrl();
              return (
                <tr key={`${applicationId}-${row.planet_id}`}>
                  <td className="load-table__col-photo">
                    <img src={photo} alt={row.planet.title} />
                  </td>
                  <td>{row.planet.title}</td>
                  <td>{row.planet.from}</td>
                  <td>{row.planet.to}</td>
                  <td>{Math.round(row.delta_v_ms)}</td>
                  <td>{Math.round(row.propellant_kg)}</td>
                  {canEditDraft ? (
                    <td className="load-table__actions">
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
