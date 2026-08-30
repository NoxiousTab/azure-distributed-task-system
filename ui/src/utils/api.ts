// Base API configuration helper.
// Reads VITE_API_BASE_URL from environment with a sensible default.

const DEFAULT_PORT = '5000';

export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  // Fall back to whatever host the page itself was loaded from. "localhost"
  // only means "this machine" to the device making the request — if you open
  // the dev server from another device's browser (e.g. a phone on the same
  // network via --host), hardcoding localhost points that device at itself
  // instead of at your machine. Using the page's own hostname fixes that
  // automatically, with zero config, on any device.
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:${DEFAULT_PORT}`;
};