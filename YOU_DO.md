# Что нужно сделать вам вручную

Всё остальное в проекте уже настроено. Ниже — только шаги, которые нельзя выполнить без вашего аккаунта / установки ПО.

---

## 1. Запушить код на GitHub (обязательно)

Репозиторий: https://github.com/Grafcheek/interplanetary-flights-frontend

В PowerShell:

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs_5-8\interplanetary-flights-frontend

# если коммит ещё не сделан агентом — сделайте сами:
& "D:\Programs\Git\cmd\git.exe" add -A
& "D:\Programs\Git\cmd\git.exe" commit -m "lab8: Redux filter, PWA, adaptive, Tauri guest, GitHub Pages"

# ветка lab8 → GitHub
& "D:\Programs\Git\cmd\git.exe" push -u origin lab8-adaptive-pwa-tauri-deploy

# для GitHub Pages удобнее слить в main:
& "D:\Programs\Git\cmd\git.exe" checkout main
& "D:\Programs\Git\cmd\git.exe" merge lab8-adaptive-pwa-tauri-deploy
& "D:\Programs\Git\cmd\git.exe" push origin main
```

При запросе логина GitHub используйте **Personal Access Token** вместо пароля.

---

## 2. Включить GitHub Pages (один раз)

1. Откройте https://github.com/Grafcheek/interplanetary-flights-frontend/settings/pages  
2. **Build and deployment → Source:** выберите **GitHub Actions** (не «Deploy from branch»).  
3. После push в `main` зайдите в **Actions** — дождитесь зелёной галочки workflow **Deploy GitHub Pages**.  
4. Сайт: **https://grafcheek.github.io/interplanetary-flights-frontend/**

На телефоне: открыть этот URL → «Добавить на экран» (PWA).

---

## 3. Установить Rust и собрать Tauri (для защиты)

Сейчас на ПК **нет Rust** — без него `.exe` не соберётся.

1. Установите: https://rustup.rs → перезапустите терминал.  
2. Windows: **Visual Studio Build Tools** → workload **«Разработка классических приложений на C++»**.  
3. В `.env.tauri` уже указан ваш IP: `http://192.168.0.34:8080/api`.  
4. Сборка:

```powershell
cd C:\Users\admin\OneDrive\Desktop\Education\RIP_space_2026\labs_5-8\interplanetary-flights-frontend
npm run tauri:build
```

Готовый файл: `src-tauri\target\release\` (имя `.exe` смотрите в выводе команды).

Для показа на защите запускайте **этот exe**, не `tauri dev`.

---

## 4. Firewall (если с телефона не виден бэк)

Разрешите входящие для **порта 8080** (Go API) и **3000** (если используете `npm run dev:lan`):

- Параметры Windows → Брандмауэр → Дополнительные параметры → Правила для входящих → Создать правило → Порт → TCP 8080.

Проверка с телефона (та же Wi‑Fi):

```text
http://192.168.0.34:8080/api/interplanetaryflights
```

---

## 5. Проверка перед защитой (чеклист)

| # | Действие | Команда / URL |
|---|----------|----------------|
| 1 | Бэк работает | `go run ./cmd/app` + docker compose |
| 2 | Веб на ноуте | `npm run dev` → http://localhost:3000 |
| 3 | Фильтр Redux | ввести запрос → карточка → назад, фильтр на месте |
| 4 | Pages + PWA | https://grafcheek.github.io/interplanetary-flights-frontend/ |
| 5 | Адаптив | DevTools, ширины 1024px и 560px |
| 6 | LAN / Tauri | `.env.tauri`, IP `192.168.0.34` |
| 7 | Tauri release | `npm run tauri:build` → запуск `.exe` |
| 8 | HTTPS | `npm run dev:https` |
| 9 | Диаграммы в отчёт | `docs/lab8-diagrams.md` |

Подробности: **LAUNCH.md**.

---

## 6. Что уже сделано за вас

- Redux-фильтр (`planetFilterSlice`) + сохранение при навигации  
- PWA (`vite-plugin-pwa`, service worker)  
- Адаптивные стили (4 / 2 / 1 колонка)  
- Tauri-проект в `src-tauri/`, гостевой режим (`VITE_GUEST_MODE`)  
- `.env`, `.env.lan`, `.env.tauri`, `.env.pages` под IP **192.168.0.34**  
- Workflow `.github/workflows/deploy-pages.yml`  
- Сборка `npm run build:pages` проверена локально  
