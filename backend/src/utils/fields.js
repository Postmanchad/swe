// Small field validators shared by the academic-tracker routes.
// A validator takes a raw value and returns { value } or { error }.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ok = (value) => ({ value });
const bad = (error) => ({ error });
const make = (check, { nullable = false } = {}) => (x) =>
  x === null ? (nullable ? ok(null) : bad('may not be null')) : check(x);

export function parseDate(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const year = Number(x.slice(0, 4));
  if (year < 1900 || year > 2200) return null;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x ? x : null;
}

/** 'YYYY-MM' or 'YYYY-MM-DD' -> 'YYYY-MM-01', or null if invalid. */
export function parseMonth(x) {
  if (typeof x !== 'string') return null;
  if (/^\d{4}-\d{2}$/.test(x)) return parseDate(`${x}-01`);
  const d = parseDate(x);
  return d ? `${d.slice(0, 7)}-01` : null;
}

export const v = {
  text: ({ max = 200, blank = false, nullable = false } = {}) =>
    make((x) => {
      if (typeof x !== 'string') return bad('must be a string');
      const s = x.trim();
      if (s === '') {
        if (nullable) return ok(null);
        return blank ? ok('') : bad('may not be empty');
      }
      return s.length > max ? bad(`must be at most ${max} characters`) : ok(s);
    }, { nullable }),

  oneOf: (allowed) =>
    make((x) => (allowed.includes(x) ? ok(x) : bad(`must be one of: ${allowed.join(', ')}`))),

  timestamp: ({ nullable = false } = {}) =>
    make((x) => {
      const d = typeof x === 'string' ? new Date(x) : null;
      return d && !Number.isNaN(d.getTime()) ? ok(d) : bad('must be an ISO date-time');
    }, { nullable }),

  date: ({ nullable = false } = {}) =>
    make((x) => {
      const d = parseDate(x);
      return d ? ok(d) : bad('must be a date like 2026-11-30');
    }, { nullable }),

  month: () =>
    make((x) => {
      const m = parseMonth(x);
      return m ? ok(m) : bad('must be a month like 2026-11');
    }),

  bool: () => make((x) => (typeof x === 'boolean' ? ok(x) : bad('must be true or false'))),

  color: ({ nullable = true } = {}) =>
    make((x) => (typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x) ? ok(x) : bad('must be a hex colour like #3b82f6')), { nullable }),

  id: ({ nullable = false } = {}) =>
    make((x) => (Number.isInteger(x) && x > 0 && x < 2_147_483_647 ? ok(x) : bad('must be a positive integer id')), { nullable }),
};

export function parseId(s) {
  if (!/^\d{1,9}$/.test(String(s))) throw new HttpError(400, 'Invalid id');
  return Number(s);
}

/**
 * Validates `body` against `spec` (field name -> validator).
 * On create, `required` fields must be present. On partial (PATCH), only supplied fields are checked.
 * Unknown fields are ignored. Throws HttpError(400) on the first problem.
 */
export function validateBody(spec, body, { required = [], partial = false } = {}) {
  const values = {};
  for (const [key, validate] of Object.entries(spec)) {
    if (body[key] === undefined) {
      if (!partial && required.includes(key)) throw new HttpError(400, `${key} is required`);
      continue;
    }
    const r = validate(body[key]);
    if (r.error) throw new HttpError(400, `${key} ${r.error}`);
    values[key] = r.value;
  }
  return values;
}
