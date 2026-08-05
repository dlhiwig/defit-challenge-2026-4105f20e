/**
 * "Save this view" storage. A saved view is just the query string of the page,
 * so it automatically covers every filter, sort, dataset, page, and page-size
 * option that the page already mirrors into the URL.
 */
export interface SavedView {
  id: string;
  name: string;
  search: string;
  createdAt: number;
}

const PREFIX = 'defit:saved-views:';
const MAX_VIEWS = 12;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSavedViews(scope: string): SavedView[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(PREFIX + scope);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(v => v && typeof v.id === 'string' && typeof v.name === 'string');
  } catch {
    return [];
  }
}

function persist(scope: string, views: SavedView[]): SavedView[] {
  const store = storage();
  const trimmed = views.slice(0, MAX_VIEWS);
  if (store) {
    try {
      store.setItem(PREFIX + scope, JSON.stringify(trimmed));
    } catch {
      /* quota — saving views is best-effort */
    }
  }
  return trimmed;
}

/** Adds a view, replacing any existing one with the same name (case-insensitive). */
export function addSavedView(scope: string, name: string, search: string): SavedView[] {
  const clean = name.trim().slice(0, 60) || 'Untitled view';
  const view: SavedView = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: clean,
    search: search.startsWith('?') ? search.slice(1) : search,
    createdAt: Date.now(),
  };
  const rest = loadSavedViews(scope).filter(v => v.name.toLowerCase() !== clean.toLowerCase());
  return persist(scope, [view, ...rest]);
}

export function removeSavedView(scope: string, id: string): SavedView[] {
  return persist(scope, loadSavedViews(scope).filter(v => v.id !== id));
}

export function renameSavedView(scope: string, id: string, name: string): SavedView[] {
  const clean = name.trim().slice(0, 60);
  if (!clean) return loadSavedViews(scope);
  return persist(scope, loadSavedViews(scope).map(v => (v.id === id ? { ...v, name: clean } : v)));
}

/** Human-readable description of what a saved view holds, e.g. `sort=score · page 2`. */
export function describeView(search: string, labels: Record<string, (value: string) => string>): string {
  const params = new URLSearchParams(search);
  const parts: string[] = [];
  params.forEach((value, key) => {
    const fn = labels[key];
    if (fn) parts.push(fn(value));
  });
  return parts.length ? parts.join(' · ') : 'Default view';
}
