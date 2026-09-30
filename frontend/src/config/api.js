// Base URL for TuneWave backend API and media endpoints
export const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  : 'http://localhost:8000';
