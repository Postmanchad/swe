// Thin fetch wrapper for the Simplroutine backend.
// Stores the JWT in localStorage and adds it to every request.
// Set VITE_API_URL in frontend/.env to point at a different server.

const BASE = (import.meta.env?.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'simplroutine.token';

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status; // 0 means the server could not be reached
  }
}

// --- token storage (localStorage can throw in private mode, so every access is guarded) ---
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* the session just won't survive a reload */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

// Called when the server rejects a stored token (expired or invalid), so the UI can show the login page.
const unauthorizedListeners = new Set();
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (value instanceof Date) search.append(key, value.toISOString());
    else if (Array.isArray(value)) search.append(key, value.join(','));
    else search.append(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}${queryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      clearToken();
      unauthorizedListeners.forEach((fn) => fn());
    }
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data;
}

// --- authentication ---
export const auth = {
  async register({ email, password, name }) {
    const data = await request('/auth/register', { method: 'POST', body: { email, password, name }, auth: false });
    setToken(data.token);
    return data.user;
  },
  async login({ email, password }) {
    const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(data.token);
    return data.user;
  },
  async me() {
    return (await request('/auth/me')).user;
  },
  logout() {
    clearToken();
  },
};

// --- resources ---
// Each has list(filters), get(id), create(body), update(id, partialBody), remove(id).
function resource(path, one, many) {
  return {
    list: async (query) => (await request(path, { query }))[many],
    get: async (id) => (await request(`${path}/${id}`))[one],
    create: async (body) => (await request(path, { method: 'POST', body }))[one],
    update: async (id, body) => (await request(`${path}/${id}`, { method: 'PATCH', body }))[one],
    remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const courses = resource('/courses', 'course', 'courses');
export const assignments = resource('/assignments', 'assignment', 'assignments');
export const goals = resource('/goals', 'goal', 'goals');
export const tasks = resource('/tasks', 'task', 'tasks');
export const intentions = resource('/intentions', 'intention', 'intentions');

const baseEvents = resource('/events', 'event', 'events');
export const events = {
  ...baseEvents,
  // Occurrences overlapping [from, to), recurring events already expanded.
  // Each result also has `start` and `end` as Date objects.
  async list({ from, to }) {
    const list = await baseEvents.list({ from, to });
    return list.map((e) => ({ ...e, start: new Date(e.start_time), end: new Date(e.end_time) }));
  },
  // New events default to the browser's time zone so recurring events keep their local clock time.
  create: (body) => baseEvents.create({ tz: localTimeZone, ...body }),
};
