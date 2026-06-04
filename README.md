# Інформаційна система автоматизації документообігу та координації проєктів студентських організацій

Повнофункціональний веб-застосунок для студентських організацій: ведення проєктів, задач (Kanban), а головне — **електронний документообіг з маршрутом узгодження** (наказів, кошторисів, звітів тощо).

## Технологічний стек

| Шар | Технології |
|-----|-----------|
| Фронтенд | React 18, Vite, React Router |
| Бекенд | Node.js, Express, JWT-авторизація |
| База даних | PostgreSQL |
| Безпека | bcrypt (хешування паролів), JWT, рольовий доступ |

## Можливості

- 🔐 **Авторизація та ролі** — `admin`, `head` (керівник), `member` (учасник) з розмежуванням прав.
- 🏛 **Організації** — облік студентських організацій та їх складу.
- 📁 **Проєкти** — створення проєктів, управління складом учасників, статуси.
- ✅ **Задачі** — Kanban-дошка (До виконання → В роботі → Перевірка → Готово), пріоритети, дедлайни, виконавці.
- 📄 **Документообіг** — створення документів, маршрут узгодження з кількома погоджувачами, рішення (погодити/відхилити з коментарем), історія змін, коментарі.
- 📎 **Файли** — прикріплення документів (до 10 МБ), завантаження та видалення.
- 📋 **Шаблони документів** — наказ, кошторис, звіт, заявка; швидке створення з готового шаблону.
- ➡️ **Делегування** — погоджувач може передати свій крок узгодження іншій особі.
- 🔔 **Сповіщення** — in-app сповіщення + email (через SMTP, або лог у консоль для розробки) про запити на погодження та рішення.
- 📰 **Стрічка активності** — журнал подій по документах, проєктах і задачах.
- 📅 **Календар** — дедлайни задач та терміни проєктів у вигляді місячного календаря.
- 📈 **Метрики (адмін)** — середній час узгодження, «застряглі» документи, навантаження учасників, активність за 14 днів.
- 📊 **Дашборд** — зведена статистика та документи, що чекають на ваше рішення.

## Структура проєкту

```
EventManagementSystem/
├── server/                  # Бекенд (Node/Express) — шарова архітектура
│   ├── src/
│   │   ├── index.js         # Точка входу (запуск сервера)
│   │   ├── app.js           # Налаштування Express-застосунку
│   │   ├── config/          # env.js — централізована конфігурація
│   │   ├── db/              # pool.js, schema.sql, init.js, seed.js
│   │   ├── middleware/      # auth (JWT, ролі), errorHandler, upload (multer)
│   │   ├── lib/             # approval.js (логіка статусу), httpError.js
│   │   ├── routes/          # лише ендпоінти + index.js (агрегатор)
│   │   ├── controllers/     # обробка req/res, виклик сервісів
│   │   ├── services/        # бізнес-логіка, транзакції (*.service.js)
│   │   └── repositories/    # доступ до даних, SQL (*.repository.js)
│   ├── tests/               # юніт-тести (node:test)
│   ├── uploads/             # завантажені файли (створюється автоматично)
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── client/                  # Фронтенд (React + Vite)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js    # базовий HTTP-клієнт з JWT
│   │   │   └── resources.js # ресурсні API-модулі (authApi, documentsApi…)
│   │   ├── constants/       # labels.js — лейбли статусів, іконки
│   │   ├── context/         # AuthContext
│   │   ├── components/      # Layout, StatusBadge
│   │   ├── pages/           # Login, Dashboard, Projects, Tasks, Documents …
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── docs/                    # ER-діаграма та опис БД
```

> Потік запиту на бекенді: **route → controller → service → repository → БД**.
> Маршрут лише оголошує ендпоінт і middleware; контролер працює з req/res;
> сервіс містить бізнес-логіку й транзакції; репозиторій — увесь SQL.

## Швидкий старт через Docker (рекомендовано)

Потрібен лише Docker. Одна команда піднімає PostgreSQL + бекенд + фронтенд:

```bash
docker compose up --build
```

- Фронтенд: **http://localhost:8080**
- API: **http://localhost:4000**

Схема БД і демо-дані завантажуються автоматично при старті.

## Встановлення та запуск (вручну)

### Передумови
- Node.js 18+
- PostgreSQL 13+

### 1. База даних

Створіть базу даних:

```bash
createdb studorg_docflow
# або у psql:  CREATE DATABASE studorg_docflow;
```

### 2. Бекенд

```bash
cd server
cp .env.example .env          # відредагуйте DATABASE_URL та JWT_SECRET
npm install
npm run db:init               # створення таблиць (schema.sql)
npm run db:seed               # завантаження демо-даних (необов'язково)
npm run dev                   # сервер на http://localhost:4000
```

### 3. Фронтенд

У новому терміналі:

```bash
cd client
npm install
npm run dev                   # застосунок на http://localhost:5173
```

Відкрийте **http://localhost:5173**.

### Тестові акаунти (після `db:seed`)

Пароль для всіх: `password123`

| Email | Роль |
|-------|------|
| `admin@studorg.ua` | Адміністратор |
| `head@studorg.ua` | Керівник |
| `member@studorg.ua` | Учасник |

## API (основні ендпоінти)

Усі маршрути, крім `/api/auth/*`, потребують заголовок `Authorization: Bearer <token>`.

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід (повертає JWT) |
| GET | `/api/auth/me` | Поточний користувач |
| GET | `/api/dashboard` | Зведена статистика |
| GET/POST | `/api/organizations` | Організації (POST — лише admin) |
| GET/POST | `/api/projects` | Проєкти (POST — admin/head) |
| GET | `/api/projects/:id` | Деталі проєкту з учасниками |
| POST | `/api/projects/:id/members` | Додати учасника |
| GET/POST/PUT/DELETE | `/api/tasks` | Задачі |
| GET/POST | `/api/documents` | Документи (фільтри: `mine`, `pending_for_me`, `project_id`, `status`) |
| GET | `/api/documents/:id` | Документ з маршрутом, історією, коментарями |
| POST | `/api/documents/:id/submit` | Відправити на узгодження (`approver_ids`) |
| POST | `/api/documents/:id/decision` | Рішення погоджувача (`decision`, `comment`) |
| POST | `/api/documents/:id/delegate` | Делегувати крок (`to_user_id`) |
| POST | `/api/documents/:id/comments` | Додати коментар |
| GET/POST | `/api/templates` | Шаблони документів |
| POST | `/api/attachments/document/:id` | Завантажити файл (multipart `file`) |
| GET | `/api/attachments/:id/download` | Завантажити файл |
| GET | `/api/notifications` | Мої сповіщення (+ `/count`, `/:id/read`, `/read-all`) |
| GET | `/api/activity` | Стрічка активності |
| GET | `/api/metrics` | Аналітика (лише admin) |

## Тестування

Юніт-тести бекенду (вбудований тест-раннер Node, без зовнішніх залежностей):

```bash
cd server && npm test
```

Покрито логіку визначення статусу документа за маршрутом узгодження та JWT-middleware (авторизація й перевірка ролей).

## База даних

Детальний опис таблиць — у [`docs/database.md`](docs/database.md). ER-діаграма (Mermaid) — у [`docs/ER-diagram.mermaid`](docs/ER-diagram.mermaid).

## Ліцензія

Навчальний проєкт.
