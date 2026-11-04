CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per event or recurring series.
-- recurrence_days: weekdays the series repeats on, 0 = Sunday ... 6 = Saturday.
-- NULL or empty means a one-off event. Occurrences are expanded at read time.
-- tz keeps recurring events at the same wall-clock time across daylight saving.
CREATE TABLE events (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  notes            TEXT NOT NULL DEFAULT '',
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ NOT NULL,
  all_day          BOOLEAN NOT NULL DEFAULT false,
  color            TEXT,
  recurrence_days  SMALLINT[],
  recurrence_until TIMESTAMPTZ,
  tz               TEXT NOT NULL DEFAULT 'UTC',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX events_user_start_idx ON events (user_id, start_time);
