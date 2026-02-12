"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";
export const TOKEN_KEY = "golestan_demo_access_token";
export const REFRESH_TOKEN_KEY = "golestan_demo_refresh_token";
export const USER_PROFILE_KEY = "golestan_demo_user_profile";

export type AuthUserProfile = {
  id?: string;
  username?: string;
  roles?: string[];
  [key: string]: unknown;
};

export function saveAuthTokens(accessToken: string, refreshToken?: string | null, user?: AuthUserProfile | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
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
    const existing = localStorage.getItem(TOKEN_KEY);
    setToken(existing);
    setReady(true);
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
      if (!token) {
        setLoading(false);
        setError("auth_failed");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}${path}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        if (!res.ok) {
          if (res.status === 401) {
            clearAuthTokens();
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
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`status_${response.status}`);
  }
  const json = await response.json();
  return json.data as T;
}

export function apiBaseUrl() {
  return API_URL;
}
