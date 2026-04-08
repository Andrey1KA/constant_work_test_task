# Интеллектуальный менеджер задач (Next.js 14)

---

## 1. Краткое описание проекта и реализованных функций

Задачи: CRUD (UUID, `title`, `description`, `priority`, `status`, `dueDate`, `category`, метки времени), таблица + модалки Ant Design, удаление с подтверждением.

Фильтрация и поиск (сервер): статус, приоритет, текстовый поиск по названию/описанию (`q`), диапазон сроков, «только просроченные»; пагинация (`page`, `pageSize`, по умолчанию 1×20), сортировка (`sortBy`, `sortOrder`), в ответе `total`.

LLM (US-3–US-6): категория, декомпозиция с редактированием строк и массовым созданием задач, приоритет со сроком, сводка нагрузки со streaming в UI. Промпты: system + контекст задач + few-shot; ответы с JSON валидируются Zod.

Демо-режим: если `OPENAI_API_KEY` пустой или отсутствует, вызовов к OpenAI нет; эндпоинты `/api/v1/llm/*` отдают стабильные демо-ответы (валидный JSON или поток markdown для сводки), чтобы проверить весь UI без ключа. Реальный режим: задать ключ и `OPENAI_MODEL` в `.env`, перезапустить сервер.

Тесты: Vitest (unit), Playwright (E2E, US-1…US-6).

---

## 2. Пошаговые инструкции настройки среды

1. Node.js 20+ (`node -v`).
2. Клонировать репозиторий, в корне: `npm install` (выполнится `prisma generate`).
3. Скопировать окружение: `cp .env.example .env` (Windows: `copy .env.example .env`).
4. База: `npx prisma migrate deploy` или `npx prisma db push`.
5. E2E (опционально): `npm run test:e2e:install`.

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | SQLite, например `file:./dev.db` |
| `OPENAI_API_KEY` | Пусто → демо LLM; иначе реальный OpenAI |
| `OPENAI_MODEL` | Например `gpt-4o-mini` |
| `LLM_CACHE_TTL_MS` | TTL кэша LLM в мс (по умолчанию 300000; `0` — без кэша) |
| `LLM_RATE_LIMIT_MAX` / `LLM_RATE_LIMIT_WINDOW_MS` | Лимит запросов к LLM с клиента; `0` у max — отключить |
| `LLM_LOG_USAGE` | `1` — лог usage токенов в stdout (актуально с ключом) |

`.env` не коммитить.

---

## 3. Инструкции запуска приложения (фронтенд и бэкенд)

Один процесс Next.js: страницы в `app/`, API в `app/api/v1/`.

Разработка: `npm run dev` → [http://localhost:3000](http://localhost:3000) (редирект на `/tasks`).

Продакшен: `npm run build` → `npm start`.

Тесты: `npm run test:run`, `npm run test:e2e`.

---

## 4. Описание принятых архитектурных решений

- Слои: Route Handler → `lib/services` (Zod, правила) → `lib/repositories` + Prisma → SQLite; LLM в `lib/services/llmService.ts`.
- API: `/api/v1`, REST, коды 201 / 204 / 400 / 404 / 429 / 502; ошибки `{ success: false, error: { code, message, details? } }`.
- Клиент: axios на `/api/v1`, TanStack Query, сообщения об ошибках через Ant Design `message`.
- LLM: кэш в памяти, дедуп параллельных одинаковых запросов, rate limit по IP, streaming сводки; при ответах OpenAI — опциональный лог usage.

---

## 5. Известные проблемы, ограничения или компромиссы

- Общая SQLite без пользователей и `userId`.
- Декомпозиция создаёт отдельные задачи без `parentId`.
- Поиск в SQLite может быть регистрозависимым.
- Флаг «просроченные» не комбинируется с диапазоном дат в одном запросе.
- Список задач всегда постраничный через API (дефолт pageSize 20).
- Кэш и rate limit LLM — в памяти процесса (не кластер).
- Сводка: агрегаты не считаются на сервере заранее, текст строит LLM (в демо — заглушка).

---

## 6. Список функций, которые кандидат добавил бы при наличии дополнительного времени

- Аутентификация, `userId`, изоляция данных.
- PostgreSQL, CI с миграциями, внешний vault секретов.
- Иерархия задач (`parentId`), распределённый кэш/лимиты для LLM (Redis), очередь фоновых LLM-задач.
- Роли, аудит, больше интеграционных тестов API.

---

Стек: Next.js 14, React 18, TypeScript, Ant Design 5, TanStack Query, Prisma, SQLite, Zod, OpenAI SDK, Vitest, Playwright.

Лицензия: учебный / тестовый проект.
