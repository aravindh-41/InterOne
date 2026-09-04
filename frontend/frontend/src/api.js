const rawUrl = import.meta.env.VITE_API_URL || "https://interone.onrender.com";

// 1. Force HTTPS (prevents Render HTTP -> HTTPS redirects that drop POST/DELETE)
const secureUrl = rawUrl.replace(/^http:\/\//, 'https://');

// 2. Strip trailing slash
export const API_BASE_URL = secureUrl.replace(/\/$/, '');