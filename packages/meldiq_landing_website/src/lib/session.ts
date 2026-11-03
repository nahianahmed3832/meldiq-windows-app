import { ApiError, endpoints, type Fetcher, request, type SessionGrant, type AccountView } from "./api";
import type { z } from "zod";

/**
 * The website's sign-in session: the same Meldiq account session every client uses (POST /v2/auth/login), not a second
 * account system. Kept in this tab's sessionStorage only: closing the tab signs the website out, and the session never
 * outlives the browser (docs/SECURITY.md › Sessions). The page's strict CSP allows no third-party script to read it.
 * The access token lasts minutes; it is renewed with the refresh token when it is about to expire or is refused.
 */
const KEY = "meldiq.site.session";
/** Renew a little before the access token expires, so a request never starts with a token about to lapse. */
const RENEW_EARLY_MS = 30_000;

export interface StoredSession {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  account: AccountView;
}

/** The part of Storage this needs (sessionStorage in the browser, a Map in tests). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const fromGrant = (g: SessionGrant): StoredSession => ({
  accessToken: g.accessToken,
  accessTokenExpiresAt: g.accessTokenExpiresAt,
  refreshToken: g.refreshToken,
  refreshTokenExpiresAt: g.refreshTokenExpiresAt,
  account: g.account,
});

function isStored(v: unknown): v is StoredSession {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.accessToken === "string" &&
    typeof s.refreshToken === "string" &&
    typeof s.accessTokenExpiresAt === "number" &&
    typeof s.refreshTokenExpiresAt === "number" &&
    !!s.account
  );
}

export class SessionStore {
  private renewing: Promise<StoredSession | null> | null = null;

  constructor(
    private readonly storage: KeyValueStore | null,
    private readonly fetcher?: Fetcher,
    private readonly clock: () => number = Date.now,
  ) {}

  current(): StoredSession | null {
    try {
      const raw = this.storage?.getItem(KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isStored(parsed) || parsed.refreshTokenExpiresAt <= this.clock()) {
        this.clear();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  save(grant: SessionGrant): StoredSession {
    const s = fromGrant(grant);
    try {
      this.storage?.setItem(KEY, JSON.stringify(s));
    } catch {
      // Storage refused (private mode, full): the session still works until the page is closed.
    }
    return s;
  }

  clear(): void {
    try {
      this.storage?.removeItem(KEY);
    } catch {
      // Nothing stored to remove.
    }
  }

  /** A usable access token, renewed first when it is about to expire; null when signed out. */
  async accessToken(force = false): Promise<string | null> {
    const s = this.current();
    if (!s) return null;
    if (!force && s.accessTokenExpiresAt - RENEW_EARLY_MS > this.clock()) return s.accessToken;
    // One renewal at a time: the refresh token rotates, so two at once would race.
    this.renewing ??= this.renew(s).finally(() => (this.renewing = null));
    return (await this.renewing)?.accessToken ?? null;
  }

  private async renew(s: StoredSession): Promise<StoredSession | null> {
    try {
      return this.save(await endpoints.refresh(s.refreshToken, this.fetcher));
    } catch (e) {
      // A refused refresh token means signed out; a network failure keeps the session for the next try.
      if (e instanceof ApiError && e.status === 401) this.clear();
      if (e instanceof ApiError && e.code === "network") throw e;
      return null;
    }
  }

  /** An authenticated request; one retry with a renewed token if the server refuses the first. */
  async authed<T>(path: string, schema: z.ZodType<T>, opts: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
    const token = await this.accessToken();
    if (!token) throw new ApiError(401, "unauthorized", "Sign in to continue.");
    try {
      return await request(path, schema, { ...opts, token }, this.fetcher);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      const renewed = await this.accessToken(true);
      if (!renewed) throw e;
      return request(path, schema, { ...opts, token: renewed }, this.fetcher);
    }
  }

  /** Ends the session on the server too (other devices stay signed in). */
  async signOut(): Promise<void> {
    const s = this.current();
    this.clear();
    if (s) await endpoints.logout(s.accessToken, this.fetcher).catch(() => undefined);
  }
}

let shared: SessionStore | null = null;

/** The browser's session store (sessionStorage); on the build server there is none. */
export function browserSession(): SessionStore {
  if (!shared) {
    let storage: KeyValueStore | null;
    try {
      storage = typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
      storage = null;
    }
    shared = new SessionStore(storage);
  }
  return shared;
}
