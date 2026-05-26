# Инструкция по запуску (лабораторная 8)

Полный сценарий: **PWA на GitHub Pages (mock)** → **фильтр Redux** → **адаптивность** → **backend по IP** → **Tauri (release)** → **HTTPS локально**.

---

## 1. Требования

| Компонент | Версия / примечание |
|-----------|---------------------|
| Node.js | 20+ |
| npm | 10+ |
| Docker Desktop | для Postgres, Redis, MinIO |
| Go | 1.22+ (backend) |
| Rust | для сборки Tauri ([rustup.rs](https://rustup.rs)) |
| Visual Studio Build Tools | C++ workload (Windows, для Tauri) |

---

## 2. Backend (Go)

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs\RIP_space_2026

docker compose up -d

go run ./cmd/app
```

Сервер слушает **`:8080`** на всех интерфейсах. Swagger: `http://localhost:8080/swagger/index.html`

### IP для LAN (не localhost)

Узнай IP компьютера с backend:

```powershell
ipconfig
```

Пример: `192.168.0.10`. API для клиентов в сети:

```text
http://192.168.0.10:8080/api
```

Проверка с другого устройства в той же Wi‑Fi сети:

```text
http://192.168.0.10:8080/api/interplanetaryflights
```

---

## 3. Frontend (веб, полный режим)

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs_5-8\interplanetary-flights-frontend

npm install
copy .env.example .env
```

В `.env` для локальной разработки через proxy достаточно:

```env
VITE_BASE_PATH=/
VITE_API_BASE_URL=/api
```

Запуск:

```powershell
npm run dev
```

Открыть: `http://localhost:3000`

### Работа с backend по IP (без proxy)

Скопируй `.env.lan` в `.env` или запусти:

```powershell
npm run dev:lan
```

В `.env.lan` замени `192.168.0.10` на свой IP.

---

## 4. GitHub Pages + PWA (mock на телефоне)

1. В репозитории GitHub: **Settings → Pages → Source: GitHub Actions**.
2. В `.env.pages` укажи имя репозитория:

```env
VITE_BASE_PATH=/interplanetary-flights-frontend/
```

3. Локальная проверка сборки:

```powershell
npm run build:pages
npm run preview
```

4. Публикация:

```powershell
npm run deploy:pages
```

или push в `main` — сработает workflow `.github/workflows/deploy-pages.yml`.

5. На телефоне открой URL Pages, установи **Add to Home Screen** (PWA).

На Pages backend недоступен — каталог работает на **mock-данных** (`PLANETS_MOCK`).

---

## 5. Демонстрация фильтра Redux

1. Открой каталог, введи запрос (например `Mars`), нажми **Найти**.
2. Открой карточку (**Подробнее**).
3. Вернись назад — фильтр и список сохранены.
4. В Chrome установи [Redux DevTools](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) и покажи action `planetFilter/setQuery`, `planetFilter/applyQuery`.

Код: `src/store/slices/planetFilterSlice.ts`, `src/pages/PlanetsPage/PlanetsPage.tsx`.

---

## 6. Адаптивность (3 страницы)

Показ в DevTools → Toggle device toolbar:

| Ширина | Колонки карточек | Где в коде |
|--------|------------------|------------|
| > 1024px | 4 | `.container` в `src/cosmos-styles.css` |
| ≤ 1024px | 2 | `@media (max-width: 1024px)` |
| ≤ 560px | 1 | `@media (max-width: 560px)` |

Страницы с адаптивом: **каталог**, **деталь маршрута**, **страница входа** (`auth-page--cosmos`).

---

## 7. Tauri (гостевое приложение, release)

### Настройка API по IP

Отредактируй `.env.tauri`:

```env
VITE_GUEST_MODE=true
VITE_API_BASE_URL=http://192.168.0.10:8080/api
```

`192.168.0.10` — IP машины с Go-backend (тот же, что показываешь в `ipconfig`).

### Режим разработки

```powershell
npm run tauri:dev
```

3 страницы гостя: **Каталог**, **Маршрут**, **О приложении** (показывает текущий `VITE_API_BASE_URL`).

### Release-сборка (для защиты)

```powershell
npm run tauri:build
```

Готовый `.exe`:

```text
src-tauri\target\release\interplanetary-flights-guest.exe
```

(имя может отличаться — смотри вывод команды).

### Wireshark / tcpdump

Запусти собранный `.exe`, в Wireshark фильтр `tcp.port == 8080` — видны запросы к backend по LAN IP.

Измени запись в БД (Adminer `http://localhost:8081`, Postgres `5433`) → обнови каталог в Tauri.

---

## 8. HTTPS локально

```powershell
npm run dev:https
```

или после сборки:

```powershell
npm run build
npm run preview:https
```

Браузер покажет самоподписанный сертификат (`@vitejs/plugin-basic-ssl`). URL будет `https://localhost:3000`.

---

## 9. Порядок показа на защите (кратко)

1. Телефон → GitHub Pages → установить PWA.
2. PWA → фильтр → деталь → назад (фильтр сохранён).
3. DevTools → смена ширины → показать брейкпоинты в CSS.
4. ПК → Pages или `npm run dev:lan` → данные с backend.
5. Запустить **release** Tauri → те же данные по IP из `.env.tauri`.
6. Сравнить IP из `ipconfig` и из `.env.tauri`.
7. Wireshark → порт/API backend.
8. Изменение в БД → обновление в Tauri.
9. `npm run dev:https` → показать HTTPS.

---

## 10. Диаграммы для отчёта

Файл: `docs/lab8-diagrams.md` (deployment, состояния заявок, прецеденты).

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| Tauri не собирается | Установи Rust + VS Build Tools, перезапусти терминал |
| Backend недоступен по IP | Проверь firewall Windows для порта 8080 |
| Пустой каталог на Pages | Это нормально без backend — используются mock |
| CORS | На Go уже включён `Access-Control-Allow-Origin: *` |
| Неверные пути на Pages | Проверь `VITE_BASE_PATH` = `/имя-репозитория/` |
