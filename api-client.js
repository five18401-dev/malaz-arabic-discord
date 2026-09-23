/*
 * Malaz API client
 * لا يضع هذا الملف توكن Discord أبداً.
 * اضبط رابط Railway في window.MALAZ_API_URL قبل تحميل app.js، أو اتركه
 * فارغاً مؤقتاً لتستمر الواجهة بالبيانات التجريبية الحالية.
 */
(function (window) {
  "use strict";

  const API_URL = String(window.MALAZ_API_URL || "").replace(/\/$/, "");

  async function request(path, options) {
    if (!API_URL) {
      throw new Error("MALAZ_API_URL is not configured");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options && options.headers)
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  window.MalazAPI = {
    enabled: Boolean(API_URL),
    health: () => request("/health"),
    server: () => request("/api/public/server"),
    roles: () => request("/api/public/roles"),
    members: (query = "") => request(`/api/public/members${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    member: (id) => request(`/api/public/member/${encodeURIComponent(id)}`),
    leaderboard: () => request("/api/public/leaderboard")
  };
})(window);
