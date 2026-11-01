/**
 * Utility to determine the backend server URL and WebSocket endpoint.
 * When running directly on the full-stack server (Google Cloud Run or local dev),
 * the current origin is used.
 * When exported or deployed to a static host (such as GitHub Pages 'github.io'),
 * it automatically routes WebSocket and API requests to the live backend server.
 */

const STORAGE_KEY = 'tanach_custom_server_url';

// Default live backend server for static hosting
export const DEFAULT_SERVER_URL = 'https://tanach-quiz-server.onrender.com';
export const DEFAULT_CLOUD_RUN_SERVER = DEFAULT_SERVER_URL;

export function isStaticDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host.endsWith('github.io') || host.endsWith('pages.dev') || host.endsWith('vercel.app') || host.endsWith('netlify.app');
}

export function getServerBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. User manual override in localStorage
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && custom.trim().length > 0) {
      // Auto-migrate if the user had previously saved the inaccessible internal AI Studio URL
      if (custom.includes('ais-pre-piw5nfxiw2pqvih4japf72-49901692255') || custom.includes('run.app')) {
        localStorage.setItem(STORAGE_KEY, DEFAULT_SERVER_URL);
        return DEFAULT_SERVER_URL;
      }
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {
    // Ignore localStorage error
  }

  // 2. Vite environment variable if specified during build
  if (import.meta.env.VITE_SERVER_URL) {
    return (import.meta.env.VITE_SERVER_URL as string).replace(/\/+$/, '');
  }

  // 3. If deployed on GitHub Pages or other static hosting, use default backend
  if (isStaticDeployment()) {
    return DEFAULT_SERVER_URL;
  }

  // 4. Fallback to same-origin (for full-stack dev and Cloud Run)
  return window.location.origin;
}

export function getWebSocketUrl(): string {
  const base = getServerBaseUrl();
  if (!base) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}`;
  }

  try {
    const url = new URL(base);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}`;
  } catch (err) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}`;
  }
}

export function getApiUrl(endpoint: string): string {
  const base = getServerBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base is empty or same origin, return clean relative URL
  if (typeof window !== 'undefined' && (base === window.location.origin || !base)) {
    return cleanEndpoint;
  }

  return `${base}${cleanEndpoint}`;
}

export function setCustomServerUrl(url: string | null): void {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    }
  } catch (e) {
    console.warn('Failed to save server URL in localStorage:', e);
  }
}

export function getCustomServerUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
