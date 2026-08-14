export type Route =
  | { name: 'home' }
  | { name: 'workout'; id: string }
  | { name: 'history' }
  | { name: 'stats' }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case undefined:
      return { name: 'home' };
    case 'workout':
      return parts[1] ? { name: 'workout', id: parts[1] } : { name: 'home' };
    case 'history':
      return { name: 'history' };
    case 'stats':
      return { name: 'stats' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'home' };
  }
}

export function navigate(path: string): void {
  location.hash = path.startsWith('/') ? `#${path}` : `#/${path}`;
}
