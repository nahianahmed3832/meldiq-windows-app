import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { browserSession, type StoredSession } from "../lib/session";

/** Whether this tab has a Meldiq session (false during the static render, so the page hydrates the same). */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(browserSession().current() !== null), []);
  return signedIn;
}

/**
 * Pages that need a signed-in account: sends a signed-out visitor to sign in and back. Returns null until the session
 * is known (the page shows its loading state, never account data from the build).
 */
export function useRequireSession(): StoredSession | null {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  useEffect(() => {
    const s = browserSession().current();
    if (!s) {
      void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setSession(s);
  }, [router]);
  return session;
}

export interface Loaded<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/** Loads [load] once a session exists; a refused session sends the visitor to sign in again. */
export function useAuthedData<T>(session: StoredSession | null, load: () => Promise<T>, key: string): Loaded<T> {
  const router = useRouter();
  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    if (!session) return;
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    load()
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((e: unknown) => {
        if (!live) return;
        const err = e instanceof ApiError ? e : new ApiError(0, "unexpected", "Something went wrong. Reload the page.");
        if (err.status === 401) {
          browserSession().clear();
          void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return;
        }
        setState({ data: null, error: err, loading: false });
      });
    return () => {
      live = false;
    };
    // `load` changes every render; [key] and [tick] say when to load again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, key, tick]);
  return { ...state, reload };
}
