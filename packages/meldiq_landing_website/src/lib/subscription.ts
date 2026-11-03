import type { MojoCatalog, Offer } from "./api";
import { ANNOUNCED_PLANS, PLUS_UPLOAD_BYTES } from "./site";

/** Only the approved Plus offer may be sold. Keep legacy subscriptions visible in account history. */
export function subscriptionOffers(offers: readonly Offer[], mojo: MojoCatalog | null): Offer[] {
  const plus = ANNOUNCED_PLANS[0];
  if (mojo?.plans.find((p) => p.key === plus.key)?.uploadBytes !== PLUS_UPLOAD_BYTES) return [];
  return offers.filter(
    (o) =>
      o.key === plus.key &&
      o.audience === "personal" &&
      o.interval === plus.interval &&
      o.currency.toUpperCase() === plus.currency &&
      o.amountMinor === plus.amountMinor,
  );
}

/** Marketing preview of the approved plans; never mutate the server catalog or use this to authorize payment. */
export function subscriptionPreview(mojo: MojoCatalog): MojoCatalog {
  const plus = mojo.plans.find((p) => p.key === "plus");
  return {
    ...mojo,
    enforced: mojo.enforced === true && plus?.uploadBytes === PLUS_UPLOAD_BYTES,
    plans: mojo.plans
      .filter((p) => p.key === "free" || p.key === "plus")
      .map((p) => (p.key === "plus" ? { ...p, name: "Mojo Plus", uploadBytes: PLUS_UPLOAD_BYTES } : p)),
  };
}
