# Что нужно сделать вам вручную

Всё остальное в проекте уже настроено. Ниже — только шаги, которые нельзя выполнить без вашего аккаунта / установки ПО.

---

## 1. Код на GitHub — уже залит

Репозиторий: https://github.com/Grafcheek/interplanetary-flights-frontend  
Ветки: `main` и `lab8-adaptive-pwa-tauri-deploy` (обе с полным фронтом).

Если будете править код дальше:

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs_5-8\interplanetary-flights-frontend
& "D:\Programs\Git\cmd\git.exe" add -A
& "D:\Programs\Git\cmd\git.exe" commit -m "описание изменений"
& "D:\Programs\Git\cmd\git.exe" push origin main
```

---

## 2. Включить GitHub Pages (один раз)

1. Откройте https://github.com/Grafcheek/interplanetary-flights-frontend/settings/pages  
2. **Build and deployment → Source:** выберите **GitHub Actions** (не «Deploy from branch»).  
3. После push в `main` зайдите в **Actions** — дождитесь зелёной галочки workflow **Deploy GitHub Pages**.  
4. Сайт: **https://grafcheek.github.io/interplanetary-flights-frontend/**

На телефоне: открыть этот URL → «Добавить на экран» (PWA).

---

## 3. ZeroTier + Tauri (стабильный IP для защиты)

**ZeroTier One уже установлен** (`winget install ZeroTier.ZeroTierOne`).

### Шаг A — создать виртуальную сеть (один раз)

1. Зарегистрируйтесь: https://my.zerotier.com  
2. **Create A Network** → скопируйте **Network ID** (16 символов, например `a1b2c3d4e5f6g7h8`).  
3. В трее Windows → **ZeroTier** → **Join Network** → вставьте Network ID.  
4. На https://my.zerotier.com → ваша сеть → **Members** → включите **Authorize** (галочка) для вашего ПК.  
5. В ZeroTier появится IP вида **`10.147.x.x`** — он не меняется при смене Wi‑Fi.

На ноутбуке препода/одногруппника: установить ZeroTier, Join той же сети, Authorize.

### Шаг B — прописать IP и собрать Tauri

PowerShell **от администратора** (из корня проекта):

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs_5-8\interplanetary-flights-frontend

# вариант 1: скрипт сам подключится к сети и найдёт IP
.\scripts\zerotier-setup.ps1 -NetworkId ВАШ_NETWORK_ID -Build

# вариант 2: IP уже виден в ZeroTier UI
.\scripts\zerotier-setup.ps1 -ZeroTierIp 10.147.17.42 -Build
```

Скрипт обновит `.env.tauri`, `.env.lan` и соберёт exe.

**Запускайте только:** `src-tauri\target\release\app.exe`  
(не старый ярлык из установщика NSIS/MSI — там зашит старый IP).

На странице «Гостевое приложение» должен быть ваш ZeroTier IP.

### Шаг C — backend слушает ZeroTier

Go-backend должен слушать **все интерфейсы**, не только localhost:

```powershell
# в docker-compose / .env бэка — проверьте, что API доступен снаружи
curl http://10.147.x.x:8080/api/interplanetaryflights
```

Firewall: разрешить TCP **8080** и **9000** (MinIO).

---

## 4. Rust / Tauri (если ещё не собирали)

1. Rust: https://rustup.rs  
2. Visual Studio Build Tools → **«Разработка классических приложений на C++»**  
3. Сборка:

```powershell
npm run tauri:build:clean
```

Готовый файл: `src-tauri\target\release\app.exe`

---

## 5. Firewall (если с телефона / ZeroTier не виден бэк)

Разрешите входящие для **порта 8080** (Go API), **9000** (MinIO) и **3000** (если `npm run dev:lan`):

- Параметры Windows → Брандмауэр → Дополнительные параметры → Правила для входящих → Создать правило → Порт → TCP 8080, 9000.

Проверка (ZeroTier IP или LAN):

```text
http://10.147.x.x:8080/api/interplanetaryflights
```

---

## 6. Проверка перед защитой (чеклист)

| # | Действие | Команда / URL |
|---|----------|----------------|
| 1 | Бэк работает | `go run ./cmd/app` + docker compose |
| 2 | Веб на ноуте | `npm run dev` → http://localhost:3000 |
| 3 | Фильтр Redux | ввести запрос → карточка → назад, фильтр на месте |
| 4 | Pages + PWA | https://grafcheek.github.io/interplanetary-flights-frontend/ |
| 5 | Адаптив | DevTools, ширины 1024px и 560px |
| 6 | ZeroTier + Tauri | `.env.tauri` с IP `10.147.x.x`, `npm run tauri:build:clean` |
| 7 | Tauri release | `src-tauri\target\release\app.exe` (не старый installer) |
| 8 | HTTPS | `npm run dev:https` |
| 9 | Диаграммы в отчёт | `docs/lab8-diagrams.md` |

Подробности: **LAUNCH.md**.

---

## 7. Что уже сделано за вас

- Redux-фильтр (`planetFilterSlice`) + сохранение при навигации  
- PWA (`vite-plugin-pwa`, service worker)  
- Адаптивные стили (4 / 2 / 1 колонка)  
- Tauri-проект в `src-tauri/`, гостевой режим (`VITE_GUEST_MODE`)  
- `.env.tauri`, `.env.lan` — IP через ZeroTier (`scripts/zerotier-setup.ps1`)  
- Workflow `.github/workflows/deploy-pages.yml`  
- Сборка `npm run build:pages` проверена локально  
