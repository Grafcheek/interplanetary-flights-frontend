import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchFlightRequestsList,
  finishFlightRequest,
  setListFilters,
} from "../../store/slices/flightRequestSlice";
import { interplanetaryFlightPath, ROUTES } from "../../routePaths";

function statusLabel(s: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Черновик",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
    deleted: "Удалена",
  };
  return s ? (m[s] ?? s) : "—";
}

export default function MissionsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { list, listLoading, listError, filters, itemMutationLoading } = useAppSelector(
    (s) => s.flightRequest,
  );
  const [creatorFilter, setCreatorFilter] = useState("");
  const [draftFrom, setDraftFrom] = useState(filters.fromDate);
  const [draftTo, setDraftTo] = useState(filters.toDate);
  const [draftStatus, setDraftStatus] = useState(filters.status);

  useEffect(() => {
    setDraftFrom(filters.fromDate);
    setDraftTo(filters.toDate);
    setDraftStatus(filters.status);
  }, [filters.fromDate, filters.toDate, filters.status]);

  const load = useCallback(() => {
    void dispatch(fetchFlightRequestsList());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
      return;
    }
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, navigate, load]);

  const visible = useMemo(() => {
    const q = creatorFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => (a.creator_login ?? "").toLowerCase().includes(q));
  }, [list, creatorFilter]);

  const handleApplyFilters = () => {
    dispatch(
      setListFilters({
        fromDate: draftFrom,
        toDate: draftTo,
        status: draftStatus,
      }),
    );
    void dispatch(fetchFlightRequestsList());
  };

  const goMission = (id: number) => {
    navigate(interplanetaryFlightPath(id));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="missions-page">
      <div className="missions-page__inner">
        <h1 className="missions-page__heading">
          {isModerator ? "Заявки (модератор)" : "Мои заявки"}
        </h1>

        <section className="missions-page__filters">
          <div className="missions-page__filter-row">
            <Form.Group className="missions-page__fg">
              <Form.Label>С даты</Form.Label>
              <Form.Control
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="missions-page__fg">
              <Form.Label>По дату</Form.Label>
              <Form.Control
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="missions-page__fg">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">Все</option>
                <option value="draft">Черновик</option>
                <option value="formed">Сформирована</option>
                <option value="completed">Завершена</option>
                <option value="rejected">Отклонена</option>
              </Form.Select>
            </Form.Group>
            {isModerator ? (
              <Form.Group className="missions-page__fg missions-page__fg--grow">
                <Form.Label>Создатель (на клиенте)</Form.Label>
                <Form.Control
                  type="text"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  placeholder="Часть логина"
                />
              </Form.Group>
            ) : null}
          </div>
          <Button className="missions-page__apply" onClick={handleApplyFilters}>
            Применить фильтры
          </Button>
        </section>

        {listError ? <div className="missions-page__error">{listError}</div> : null}

        {listLoading && visible.length === 0 ? (
          <div className="missions-page__loader">
            <Spinner animation="border" />
          </div>
        ) : null}

        <div className="missions-page__table-wrap">
          <Table striped bordered hover responsive className="missions-page__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Создатель</th>
                <th>Создана</th>
                <th>Формирование</th>
                <th>Завершение</th>
                <th>Модератор</th>
                {isModerator ? <th>Действия</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const id = row.interplanetary_flight_request_id;
                const finKey = `finish-${id}`;
                const finBusy = Boolean(itemMutationLoading[finKey]);
                return (
                  <tr key={id}>
                    <td>
                      <button
                        type="button"
                        className="missions-page__linkish"
                        onClick={() => goMission(id)}
                      >
                        {id}
                      </button>
                    </td>
                    <td>{statusLabel(row.status)}</td>
                    <td>{row.creator_login ?? "—"}</td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      {row.forming_date
                        ? new Date(row.forming_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      {row.finish_date
                        ? new Date(row.finish_date).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td>{row.moderator_login ?? "—"}</td>
                    {isModerator ? (
                      <td>
                        {row.status === "formed" ? (
                          <div className="missions-page__actions">
                            <Button
                              size="sm"
                              className="missions-page__btn-finish"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishFlightRequest({
                                    applicationId: id,
                                    status: "completed",
                                  }),
                                )
                              }
                            >
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              className="missions-page__btn-reject"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishFlightRequest({
                                    applicationId: id,
                                    status: "rejected",
                                  }),
                                )
                              }
                            >
                              Отклонить
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {!listLoading && visible.length === 0 ? (
          <p className="missions-page__empty">Нет заявок по текущим условиям.</p>
        ) : null}
      </div>
    </div>
  );
}
