import { subscriptionPreview } from "./subscription";
import { useEffect, useState } from "react";
import { ApiError, endpoints, type MojoCatalog, mojoCatalog, type PublicPlans, type TrialOffer } from "./api";

/**
 * The public price list (GET /v2/billing/plans), fetched once per page load and shared by every component that needs it.
 * Its `trial` says whether free days are on and how many: operators change that in the Platform Admin Console, so the
 * site never writes the numbers itself.
 */
export type CatalogLoad = { state: "loading" } | { state: "ready"; catalog: PublicPlans } | { state: "error"; message: string };

let pending: Promise<PublicPlans> | null = null;

function loadCatalog(): Promise<PublicPlans> {
  pending ??= endpoints.plans().catch((e: unknown) => {
    pending = null;
    throw e;
  });
  return pending;
}

/** Forgets the shared answer (tests). */
export function resetCatalog(): void {
  pending = null;
}

export function useCatalog(): CatalogLoad {
  const [load, setLoad] = useState<CatalogLoad>({ state: "loading" });
  useEffect(() => {
    let live = true;
    loadCatalog()
      .then((catalog) => live && setLoad({ state: "ready", catalog }))
      .catch((e: unknown) => live && setLoad({ state: "error", message: e instanceof ApiError ? e.message : "Prices couldn't be loaded." }));
    return () => {
      live = false;
    };
  }, []);
  return load;
}

/** The free days on offer now, or null (off, still loading, or unknown). */
export function trialOf(load: CatalogLoad): TrialOffer | null {
  return load.state === "ready" ? (load.catalog.trial ?? null) : null;
}

/** "14 days", "1 day". */
export function dayCount(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/** The name of the plan free days give ("Meldiq Plus"), from the price list, else the announced plans, else its key. */
export function trialPlanName(load: CatalogLoad, announced: readonly { key: string; name: string }[]): string {
  const key = trialOf(load)?.planKey;
  if (!key) return "Meldiq Plus";
  const sold = load.state === "ready" ? load.catalog.plans.find((p) => p.key === key) : undefined;
  return sold?.name ?? announced.find((p) => p.key === key)?.name ?? key;
}

export type MojoLoad = { state: "loading" } | { state: "ready"; mojo: MojoCatalog | null } | { state: "error" };

let mojoPending: Promise<MojoCatalog | null> | null = null;

/** Meldiq Plus's perks and Spark levels (GET /v2/mojo/catalog), once per page load. */
export function useMojoCatalog(): MojoLoad {
  const [load, setLoad] = useState<MojoLoad>({ state: "loading" });
  useEffect(() => {
    let live = true;
    mojoPending ??= mojoCatalog().catch((e: unknown) => {
      mojoPending = null;
      throw e;
    });
    mojoPending.then((mojo) => live && setLoad({ state: "ready", mojo })).catch(() => live && setLoad({ state: "error" }));
    return () => {
      live = false;
    };
  }, []);
  return load;
}

export function mojoOf(load: MojoLoad): MojoCatalog | null {
  return load.state === "ready" && load.mojo ? subscriptionPreview(load.mojo) : null;
}
