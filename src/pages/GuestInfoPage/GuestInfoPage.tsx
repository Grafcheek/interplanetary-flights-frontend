export default function GuestInfoPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";

  return (
    <div className="guest-info-page">
      <div className="guest-info-page__panel">
        <h1>Гостевое приложение</h1>
        <p>
          Нативный клиент для просмотра каталога межпланетных перелётов: фильтрация, карточки и
          страница маршрута без авторизации и редактирования заявок.
        </p>
        <p>
          <strong>API:</strong> <code>{apiBase}</code>
        </p>
        <p className="guest-info-page__hint">
          На защите сравните IP backend из консоли сервера с адресом в <code>.env</code> (
          <code>VITE_API_BASE_URL</code>).
        </p>
      </div>
    </div>
  );
}
