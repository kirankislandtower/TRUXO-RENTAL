export const ADMIN_UNAUTHORIZED_EVENT = "admin-unauthorized";

/**
 * fetch() for /api/admin/* calls. Authentication is the httpOnly session
 * cookie, so nothing secret is attached here. If the server says the session is
 * gone (expired or signed out elsewhere) the dashboard is told to show the
 * login screen instead of silently rendering empty tables.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers, credentials: "same-origin" });
  if (res.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
  }
  return res;
}
