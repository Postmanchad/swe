# Simplroutine backend

Express + PostgreSQL API for auth and calendar events.

## Run with Docker (from the repo root)

    docker compose up --build

API: http://localhost:4000 (check http://localhost:4000/health).
The schema in `backend/db/migrations/` loads only the first time the database volume is created.
If you already have a running database from the first backend, apply the new migration without losing data:

    docker compose exec -T db psql -U simplroutine -d simplroutine < backend/db/migrations/002_academic.sql

Or wipe and recreate everything (deletes all data) with `docker compose down -v && docker compose up --build`.

## Run without Docker

    cd backend
    cp .env.example .env      # then edit JWT_SECRET
    npm install
    # start Postgres yourself and apply db/migrations/001_init.sql
    npm run dev

## Tests

    npm test

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | /auth/register | `{ email, password, name? }` returns `{ token, user }` |
| POST | /auth/login | `{ email, password }` returns `{ token, user }` |
| GET | /auth/me | who am I; needs `Authorization: Bearer <token>` |
| GET | /events?from=ISO&to=ISO | occurrences overlapping the range, recurring ones expanded (max 400 days) |
| GET | /events/:id | the stored event or series |
| POST | /events | create |
| PATCH | /events/:id | partial update; `notes` is the inline notes field |
| DELETE | /events/:id | |

### Academic tracker, goals and tasks

All require `Authorization: Bearer <token>`. Each resource has `GET /x`, `GET /x/:id`, `POST /x`, `PATCH /x/:id`
and `DELETE /x/:id`, and responses look like `{ "assignment": {...} }` or `{ "assignments": [...] }`.

| Resource | Fields | List filters | Sort (`sort=`, `order=asc\|desc`) |
|---|---|---|---|
| `/courses` | `name`*, `code`, `term`, `instructor`, `color` | `term` | `name`, `created` |
| `/assignments` | `course_id`*, `title`*, `due_at`*, `notes`, `priority`, `status`, `submitted_at` | `course_id`, `status`, `priority`, `due_from`, `due_to`, `overdue=true\|false` | `due`, `priority`, `status`, `course`, `created` |
| `/goals` | `title`*, `description`, `kind`, `category`, `priority`, `status`, `target_date` | `kind`, `status`, `priority`, `category` | `target`, `priority`, `progress`, `created` |
| `/tasks` | `title`*, `goal_id`, `notes`, `category`, `priority`, `status`, `due_date` | `goal_id` (or `none`), `status`, `priority`, `category`, `due_from`, `due_to` | `due`, `priority`, `status`, `category`, `created` |
| `/intentions` | `month`* (`2026-11`), `body`*, `done` | `month` | `created`, `month` |

\* required on create. Values: `priority` is `low`, `medium` or `high`. Assignment `status` is `todo`, `in_progress`,
`submitted` or `graded`. Goal `kind` is `short_term` or `long_term`; goal `status` is `active`, `completed` or `abandoned`.
Task `status` is `todo`, `in_progress` or `done`. Filters accept comma lists, e.g. `?status=todo,in_progress`.
Lists return up to 200 rows (`limit` up to 500, `offset` to page).

Behaviour worth knowing:
- Assignments include `course_name`, `course_color` and a computed `overdue` flag.
  Moving an assignment to `submitted` or `graded` stamps `submitted_at` automatically.
- A goal's `progress` (0-100), `task_done` and `task_total` are computed from its tasks, so ticking off a task moves the bar.
- Moving a task to `done` stamps `completed_at`. `PATCH` a task with `"goal_id": null` to detach it from its goal.
- Deleting a course deletes its assignments, and deleting a goal deletes its tasks.

### Calendar events

Event fields: `title`, `notes`, `start_time`, `end_time`, `all_day`, `color` (`#rrggbb`),
`recurrence_days` (0 = Sunday to 6 = Saturday, e.g. `[1,3]` for Mon/Wed), `recurrence_until`, `tz` (IANA name).

Example: a class every Monday and Wednesday at 10:00 New York time

    curl -X POST localhost:4000/events -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d '{"title":"COSC 369","start_time":"2026-11-02T15:00:00Z","end_time":"2026-11-02T16:00:00Z",
           "recurrence_days":[1,3],"tz":"America/New_York"}'
