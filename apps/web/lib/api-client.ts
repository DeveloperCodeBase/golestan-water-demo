"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";
export const TOKEN_KEY = "golestan_demo_access_token";
export const REFRESH_TOKEN_KEY = "golestan_demo_refresh_token";
export const USER_PROFILE_KEY = "golestan_demo_user_profile";
const AUTH_CHANGE_EVENT = "golestan-auth-change";

export type AuthUserProfile = {
  id?: string;
  username?: string;
  roles?: string[];
  [key: string]: unknown;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function emitAuthChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function getStoredAccessToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredRefreshToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function nextPathForLogin() {
  if (!isBrowser()) return "/fa/overview";
  return `${window.location.pathname}${window.location.search}`;
}

function redirectToLogin() {
  if (!isBrowser()) return;
  if (window.location.pathname.startsWith("/login")) return;
  const next = encodeURIComponent(nextPathForLogin());
  window.location.href = `/login?next=${next}`;
}

export function saveAuthTokens(accessToken: string, refreshToken?: string | null, user?: AuthUserProfile | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }
  emitAuthChanged();
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  emitAuthChanged();
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!response.ok) {
      clearAuthTokens();
      return null;
    }
    const json = await response.json();
    const newAccessToken = json?.data?.access_token;
    if (!newAccessToken || typeof newAccessToken !== "string") {
      clearAuthTokens();
      return null;
    }
    localStorage.setItem(TOKEN_KEY, newAccessToken);
    emitAuthChanged();
    return newAccessToken;
  } catch {
    clearAuthTokens();
    return null;
  }
}

function authHeaders(headers: HeadersInit | undefined, token: string | null): Headers {
  const merged = new Headers(headers ?? {});
  if (token) {
    merged.set("Authorization", `Bearer ${token}`);
  }
  return merged;
}

async function authedFetch(path: string, init: RequestInit = {}, tokenFromCaller?: string | null): Promise<Response> {
  let token = tokenFromCaller ?? getStoredAccessToken();
  if (!token) {
    token = await tryRefreshAccessToken();
  }

  const firstResponse = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: authHeaders(init.headers, token),
    cache: init.cache ?? "no-store"
  });

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshedToken = await tryRefreshAccessToken();
  if (!refreshedToken) {
    return firstResponse;
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: authHeaders(init.headers, refreshedToken),
    cache: init.cache ?? "no-store"
  });
}

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function tokenRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return [];
    const payload = JSON.parse(decodeBase64Url(payloadPart));
    return Array.isArray(payload?.roles) ? payload.roles.filter((r: unknown) => typeof r === "string") : [];
  } catch {
    return [];
  }
}

export function useAuthProfile() {
  const { token, ready } = useApiToken();
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!ready) return;
    const tokenDerivedRoles = tokenRoles(token);
    setRoles(tokenDerivedRoles);

    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (!stored) {
      setUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUserProfile;
      setUser(parsed);
      if (!tokenDerivedRoles.length && Array.isArray(parsed.roles)) {
        setRoles(parsed.roles.filter((r) => typeof r === "string"));
      }
    } catch {
      setUser(null);
    }
  }, [ready, token]);

  return { token, ready, user, roles };
}

export function useApiToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncToken = () => setToken(getStoredAccessToken());
    syncToken();
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === REFRESH_TOKEN_KEY || event.key === null) {
        syncToken();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGE_EVENT, syncToken);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncToken);
    };
  }, []);

  return { token, ready };
}

export function useApiQuery<T>(path: string | null, fallback: T, deps: unknown[] = []) {
  const { token, ready } = useApiToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T>(fallback);

  const refreshKey = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!ready) return;
      if (!path) {
        if (mounted) {
          setData(fallback);
          setLoading(false);
          setError(null);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await authedFetch(path, { method: "GET" }, token);
        if (!res.ok) {
          if (res.status === 401) {
            clearAuthTokens();
            redirectToLogin();
            throw new Error("auth_failed");
          }
          throw new Error(`status_${res.status}`);
        }
        const json = await res.json();
        if (mounted) {
          setData((json?.data as T) ?? fallback);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "fetch_error");
          setData(fallback);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    run();

    return () => {
      mounted = false;
    };
  }, [path, token, ready, refreshKey]);

  return { data, loading, error, token };
}

export async function authedPost<T>(path: string, token: string, payload: object): Promise<T> {
  const response = await authedFetch(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    token
  );

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthTokens();
      redirectToLogin();
    }
    throw new Error(`status_${response.status}`);
  }
  const json = await response.json();
  return json.data as T;
}

export async function authedGetBlob(path: string, token: string): Promise<Blob> {
  const response = await authedFetch(
    path,
    {
      method: "GET"
    },
    token
  );
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthTokens();
      redirectToLogin();
    }
    throw new Error(`status_${response.status}`);
  }
  return response.blob();
}

export async function authedUpload<T>(path: string, token: string, formData: FormData): Promise<T> {
  const response = await authedFetch(
    path,
    {
      method: "POST",
      body: formData
    },
    token
  );

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthTokens();
      redirectToLogin();
    }
    throw new Error(`status_${response.status}`);
  }

  const json = await response.json();
  return json.data as T;
}

export function apiBaseUrl() {
  return API_URL;
}
