export default function GuestInfoPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const minioBase = import.meta.env.VITE_MINIO_BASE ?? "(not set)";
  const mode = import.meta.env.MODE;

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
        <p className="guest-info-page__hint">
          <strong>Build mode:</strong> <code>{mode}</code>
        </p>
        <p className="guest-info-page__hint">
          <strong>VITE_API_BASE_URL:</strong> <code>{apiBase}</code>
        </p>
        <p className="guest-info-page__hint">
          <strong>VITE_MINIO_BASE:</strong> <code>{minioBase}</code>
        </p>
      </div>
    </div>
  );
}
