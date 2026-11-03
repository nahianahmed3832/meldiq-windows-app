import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Fetcher } from "../src/lib/api";
import { type KeyValueStore, SessionStore } from "../src/lib/session";

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const NOW = 1_800_000_000_000;
const grant = (n: number, accessTtl = 15 * 60_000) => ({
  accessToken: `access-${n}`,
  accessTokenExpiresAt: NOW + accessTtl,
  refreshToken: `refresh-${n}`,
  refreshTokenExpiresAt: NOW + 30 * 86_400_000,
  session: { id: "ses_1" },
  account: { id: "acc_1", email: "a@b.co", name: "A", createdAt: 1 },
});

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fake API: refresh rotates tokens; /v2/x accepts only the newest access token. */
function api() {
  let n = 1;
  const calls: string[] = [];
  const fetcher: Fetcher = async (url, init) => {
    calls.push(url);
    if (url === "/v2/auth/refresh") {
      const { refreshToken } = JSON.parse(String(init?.body)) as { refreshToken: string };
      if (refreshToken !== `refresh-${n}`) return json(401, { error: { code: "unauthorized", message: "Sign in again." } });
      n++;
      return json(200, grant(n));
    }
    if (url === "/v2/auth/logout") return json(200, { ok: true });
    const auth = (init?.headers as Record<string, string>).authorization;
    return auth === `Bearer access-${n}` ? json(200, { ok: true }) : json(401, { error: { code: "unauthorized", message: "no" } });
  };
  return { fetcher, calls, rotate: () => n++ };
}

describe("the website's session", () => {
  it("is empty until signed in, and forgets unreadable or expired sessions", () => {
    const store = new MemoryStore();
    const s = new SessionStore(store, undefined, () => NOW);
    expect(s.current()).toBeNull();
    store.setItem("meldiq.site.session", "{not json");
    expect(s.current()).toBeNull();
    s.save({ ...grant(1), refreshTokenExpiresAt: NOW - 1 });
    expect(s.current()).toBeNull();
    expect(store.map.size).toBe(0);
  });

  it("uses the access token while it's fresh and renews it shortly before it expires", async () => {
    const a = api();
    const s = new SessionStore(new MemoryStore(), a.fetcher, () => NOW);
    s.save(grant(1));
    expect(await s.accessToken()).toBe("access-1");
    s.save(grant(1, 10_000));
    expect(await s.accessToken()).toBe("access-2");
    expect(s.current()?.refreshToken).toBe("refresh-2");
  });

  it("renews once for many callers at once (the refresh token rotates)", async () => {
    const a = api();
    const s = new SessionStore(new MemoryStore(), a.fetcher, () => NOW);
    s.save(grant(1, 0));
    const tokens = await Promise.all([s.accessToken(), s.accessToken(), s.accessToken()]);
    expect(tokens).toEqual(["access-2", "access-2", "access-2"]);
    expect(a.calls.filter((c) => c === "/v2/auth/refresh")).toHaveLength(1);
  });

  it("retries a refused request once with a renewed token", async () => {
    const a = api();
    const s = new SessionStore(new MemoryStore(), a.fetcher, () => NOW);
    s.save(grant(1));
    a.rotate(); // the server moved on (another tab renewed): access-1 is refused now
    s.save({ ...grant(1), refreshToken: "refresh-2" });
    expect(await s.authed("/v2/x", z.object({ ok: z.boolean() }))).toEqual({ ok: true });
  });

  it("signs out when the refresh token is refused, and on request", async () => {
    const a = api();
    const store = new MemoryStore();
    const s = new SessionStore(store, a.fetcher, () => NOW);
    s.save({ ...grant(1, 0), refreshToken: "stolen-or-old" });
    expect(await s.accessToken()).toBeNull();
    expect(s.current()).toBeNull();
    await expect(s.authed("/v2/x", z.unknown())).rejects.toMatchObject({ status: 401 });
    s.save(grant(1));
    await s.signOut();
    expect(store.map.size).toBe(0);
    expect(a.calls).toContain("/v2/auth/logout");
  });

  it("keeps working when storage is unavailable", async () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    const s = new SessionStore(broken, api().fetcher, () => NOW);
    expect(() => s.save(grant(1))).not.toThrow();
    expect(s.current()).toBeNull();
    expect(() => s.clear()).not.toThrow();
  });
});
