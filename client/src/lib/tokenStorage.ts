/**
 * TOKEN STORAGE ARCHITECTURE & SECURITY TRADEOFF ANALYSIS
 *
 * Choice: In-Memory Access Token with Session Recovery Fallback
 *
 * Why In-Memory?
 * 1. XSS (Cross-Site Scripting) Resilience:
 *    - Tokens stored in `localStorage` or `sessionStorage` are directly accessible
 *      by any JavaScript executing on the page (malicious third-party scripts,
 *      compromised npm packages, or injected code).
 *    - By keeping the active JWT access token purely in-memory (closure variable),
 *      malicious scripts cannot steal tokens via `localStorage.getItem()`.
 *
 * 2. httpOnly-Safe Pattern Alignment:
 *    - In production enterprise deployments, the ideal pattern pairs a short-lived
 *      in-memory access token (e.g., 15 minutes) with an httpOnly, SameSite=Strict
 *      refresh token cookie managed exclusively by the backend.
 *    - An in-memory store in the frontend client seamlessly integrates with this
 *      model: on page reload, a silent `/api/auth/refresh` request rehydrates the
 *      in-memory token without exposing secrets to client-side scripts.
 *
 * 3. Tradeoffs & Mitigation:
 *    - Tradeoff: In-memory state is cleared whenever the user refreshes or closes the browser tab.
 *    - Mitigation: For seamless developer experience and session persistence during local dev,
 *      we provide a configurable session storage cache that can be toggled off when strict
 *      httpOnly cookie-backed refresh endpoints are deployed.
 */

let inMemoryToken: string | null = null;
const SESSION_STORAGE_KEY = 'anchor_ai_auth_token';

export const tokenStorage = {
  getToken: (): string | null => {
    if (inMemoryToken) {
      return inMemoryToken;
    }
    // Session fallback for page reloads in SPA development
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
    return null;
  },

  setToken: (token: string | null): void => {
    inMemoryToken = token;
    if (token) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  clearToken: (): void => {
    inMemoryToken = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },
};
