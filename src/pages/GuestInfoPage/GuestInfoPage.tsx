import { useEffect, useState } from "react";
import { API_BASE_URL, BUILD_STAMP, MINIO_BASE } from "../../config/apiEndpoints";
import { isGuestMode } from "../../config/appMode";

export default function GuestInfoPage() {
  const [exeDir, setExeDir] = useState("");

  useEffect(() => {
    if (!isGuestMode) return;
    void import("@tauri-apps/api/path")
      .then(({ executableDir }) => executableDir())
      .then(setExeDir);
  }, []);

  return (
    <div className="guest-info-page">
      <div className="guest-info-page__panel">
        <h1>Гостевое приложение</h1>
        <p>
          Нативный клиент для просмотра каталога межпланетных перелётов: фильтрация, карточки и
          страница маршрута без авторизации и редактирования заявок.
        </p>
        <p>
          <strong>API:</strong> <code>{API_BASE_URL}</code>
        </p>
        <p className="guest-info-page__hint">
          На защите сравните IP backend из консоли сервера с адресом выше (ZeroTier /{" "}
          <code>.env.tauri</code>).
        </p>
        <p className="guest-info-page__hint">
          <strong>Build stamp:</strong> <code>{BUILD_STAMP}</code>
        </p>
        <p className="guest-info-page__hint">
          <strong>MINIO:</strong> <code>{MINIO_BASE}</code>
        </p>
        {exeDir ? (
          <p className="guest-info-page__hint">
            <strong>Exe folder:</strong> <code>{exeDir}</code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
