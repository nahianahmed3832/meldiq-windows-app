import type { MojoCatalog, Offer } from "./api";
import { ANNOUNCED_PLANS, PLUS_UPLOAD_BYTES } from "./site";

/** Only approved, published Plus terms may be sold. Legacy agreements remain visible in account history. */
const approvedTerms = {
  monthly: { interval: "month", frequency: 1, amount: ANNOUNCED_PLANS[0].amountMinor },
  quarterly: { interval: "month", frequency: 3, amount: 1299 },
  yearly: { interval: "year", frequency: 1, amount: 4999 },
} as const;

export function subscriptionOffers(offers: readonly Offer[], mojo: MojoCatalog | null): Offer[] {
  const plus = ANNOUNCED_PLANS[0];
  if (mojo?.plans.find((p) => p.key === plus.key)?.uploadBytes !== PLUS_UPLOAD_BYTES) return [];
  return offers.filter((offer) => {
    const term = offer.term ?? "monthly";
    const approved = approvedTerms[term];
    if (
      offer.key !== plus.key ||
      offer.audience !== "personal" ||
      offer.interval !== approved.interval ||
      (offer.billingFrequency ?? 1) !== approved.frequency ||
      offer.currency.toUpperCase() !== plus.currency ||
      offer.amountMinor !== approved.amount
    )
      return false;
    const published = mojo.plusTerms?.find((option) => option.key === term);
    if (!published && term === "monthly") {
      return mojo.onSale?.plus?.amountMinor === approved.amount && mojo.onSale.plus.currency === plus.currency;
    }
    return (
      published?.available === true &&
      published.amountMinor === approved.amount &&
      published.currency === plus.currency &&
      published.interval === approved.interval &&
      published.billingFrequency === approved.frequency
    );
  });
}

/** Marketing preview of the approved plans; never mutate the server catalog or use this to authorize payment. */
export function subscriptionPreview(mojo: MojoCatalog): MojoCatalog {
  const plus = mojo.plans.find((p) => p.key === "plus");
  return {
    ...mojo,
    enforced: mojo.enforced === true && plus?.uploadBytes === PLUS_UPLOAD_BYTES,
    plans: mojo.plans
      .filter((p) => p.key === "free" || p.key === "plus")
      .map((p) => (p.key === "plus" ? { ...p, name: "Meldiq Plus", uploadBytes: PLUS_UPLOAD_BYTES } : p)),
  };
}
