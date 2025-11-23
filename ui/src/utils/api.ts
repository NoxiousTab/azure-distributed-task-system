// Base API configuration helper.
// Reads VITE_API_BASE_URL from environment with a sensible default.

const DEFAULT_BASE_URL = 'http://localhost:5000';

export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (fromEnv && fromEnv.trim().length > 0 ? fromEnv : DEFAULT_BASE_URL).replace(/\/$/, '');
};
