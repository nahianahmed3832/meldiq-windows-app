import { useEffect, useState } from "react";
import { type SiteDetails, siteDetails } from "./api";
import { LEGAL_UPDATED, OPERATOR, PENDING } from "./site";

/**
 * Who runs Meldiq and its policies, as operators set them in the admin console (GET /v2/site/details). Each value is
 * the console's, or a visible "to be confirmed" placeholder while it isn't decided (or the API can't be reached): the
 * site never invents a business detail. Fetched once per page load and shared.
 */
export interface Operator {
  legalName: string;
  /** The registered address, with where the company is organised when known. */
  address: string;
  registration: string;
  governingLaw: string;
  supportEmail: string;
  privacyEmail: string;
  dpo: string;
  minimumAge: string;
  /** "14 days", or a placeholder. */
  refundWindow: string;
  /** The specific refund rules, one string per paragraph (a placeholder while not decided). */
  refundRules: string[];
  /** "7 days", or a placeholder. */
  gracePeriod: string;
  legalBases: string;
  billingRecordRetention: string;
  transferSafeguards: string;
  legalUpdated: string;
}

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** What the site shows before the details arrive, or without them: the decided facts and placeholders (site.ts). */
export const FALLBACK: Operator = {
  legalName: OPERATOR.legalName,
  address: OPERATOR.address,
  registration: OPERATOR.registration,
  governingLaw: OPERATOR.governingLaw,
  supportEmail: OPERATOR.supportEmail,
  privacyEmail: OPERATOR.privacyEmail,
  dpo: OPERATOR.dpo,
  minimumAge: OPERATOR.minimumAge,
  refundWindow: "14 days",
  refundRules: [OPERATOR.refundWindow],
  gracePeriod: PENDING("the grace period after a failed payment"),
  legalBases: PENDING("legal bases per processing purpose and applicable jurisdictions"),
  billingRecordRetention: PENDING("billing record retention period"),
  transferSafeguards: PENDING("transfer safeguards for the intended markets"),
  legalUpdated: LEGAL_UPDATED,
};

/** The details in the words the pages print. */
export function operatorFrom(d: SiteDetails | null): Operator {
  if (!d) return FALLBACK;
  const or = (v: string | null, fallback: string) => (v && v.trim() ? v.trim() : fallback);
  const address = d.operator.address
    ? d.operator.jurisdiction
      ? `${d.operator.address} (organised in ${d.operator.jurisdiction})`
      : d.operator.address
    : FALLBACK.address;
  return {
    legalName: or(d.operator.legalName, FALLBACK.legalName),
    address,
    registration: or(d.operator.registration, FALLBACK.registration),
    governingLaw: or(d.operator.governingLaw, FALLBACK.governingLaw),
    supportEmail: or(d.contacts.supportEmail, FALLBACK.supportEmail),
    privacyEmail: or(d.contacts.privacyEmail, FALLBACK.privacyEmail),
    dpo: or(d.contacts.dpo, FALLBACK.dpo),
    minimumAge: d.policies.minimumAge === null ? FALLBACK.minimumAge : `${d.policies.minimumAge} years old`,
    refundWindow: d.policies.refundWindowDays === null ? PENDING("the refund window") : days(d.policies.refundWindowDays),
    refundRules: d.policies.refundRules
      ? d.policies.refundRules
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : FALLBACK.refundRules,
    gracePeriod: d.policies.failedPaymentGraceDays === null ? FALLBACK.gracePeriod : days(d.policies.failedPaymentGraceDays),
    legalBases: or(d.policies.legalBases, FALLBACK.legalBases),
    billingRecordRetention: or(d.policies.billingRecordRetention, FALLBACK.billingRecordRetention),
    transferSafeguards: or(d.policies.transferSafeguards, FALLBACK.transferSafeguards),
    legalUpdated: d.legalUpdatedOn > LEGAL_UPDATED ? d.legalUpdatedOn : LEGAL_UPDATED,
  };
}

let pending: Promise<SiteDetails | null> | null = null;

export function useOperator(): Operator {
  const [op, setOp] = useState<Operator>(FALLBACK);
  useEffect(() => {
    let live = true;
    pending ??= siteDetails().catch(() => {
      pending = null;
      return null;
    });
    void pending.then((d) => live && setOp(operatorFrom(d)));
    return () => {
      live = false;
    };
  }, []);
  return op;
}
