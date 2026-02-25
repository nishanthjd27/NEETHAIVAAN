// path: client/src/utils/api.ts
// Centralised API base URL from Vite env var.

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

// Re-export axios instance for convenience
import axios from 'axios';
export default axios;
