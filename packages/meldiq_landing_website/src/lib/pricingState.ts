import type { CatalogLoad, MojoLoad } from "./catalog";
import { subscriptionOffers } from "./subscription";

/** Both sources must resolve before availability is known. A failure is never a closed sale. */
export function pricingState(billing: CatalogLoad, benefits: MojoLoad): "loading" | "error" | "unavailable" | "ready" {
  if (billing.state === "error" || benefits.state === "error") return "error";
  if (billing.state === "loading" || benefits.state === "loading") return "loading";
  if (!benefits.mojo) return "error";
  return billing.catalog.available && subscriptionOffers(billing.catalog.plans, benefits.mojo).length > 0 ? "ready" : "unavailable";
}
