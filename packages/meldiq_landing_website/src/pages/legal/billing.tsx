import Link from "next/link";
import { useOperator } from "../../lib/details";
import { Detail, LegalPage } from "../../components/LegalPage";
import { CurrentFreeDays } from "../../components/Mojo";
import { useCatalog } from "../../lib/catalog";

/** The subscription terms as the system applies them (meldiq_android docs/BILLING.md › Lifecycle and Entitlements). */
export default function BillingTerms() {
  const op = useOperator();
  const catalog = useCatalog();
  return (
    <LegalPage
      title="Mojo Plus: renewal, cancellation & refunds"
      description="How Mojo Plus works: prices, automatic renewal, trials, cancelling, failed payments, refunds, and using one plan on every device."
      intro={
        <p>
          These terms apply when you subscribe to Mojo Plus for your account. They&apos;re part of the <Link href="/legal/terms">Terms of Service</Link>. Plans
          and prices are listed on the <Link href="/pricing">pricing page</Link>.
        </p>
      }
      sections={[
        {
          id: "before",
          title: "Before you pay",
          body: (
            <p>
              Before checkout we show the plan, its price and currency, how often it&apos;s billed, that it renews automatically, any free trial, and what
              happens if a payment fails. No tax is added: the price shown is what you pay. You must agree to these terms to continue.
            </p>
          ),
        },
        {
          id: "payment",
          title: "Payment",
          body: (
            <p>
              PayPal processes new website subscriptions on its own secure pages. Meldiq never receives or stores your card details. Your plan starts once
              PayPal confirms the subscription to our servers, not when your browser returns from the payment page; some payment methods take longer to confirm.
            </p>
          ),
        },
        {
          id: "renewal",
          title: "Automatic renewal",
          body: (
            <p>
              Plans renew automatically at the end of each month, at the price shown when you subscribed, until you cancel. If we change a plan&apos;s price,
              we&apos;ll tell you before it affects your next renewal, and you can cancel before then.
            </p>
          ),
        },
        {
          id: "trials",
          title: "Free trials",
          body: (
            <>
              <p>
                While free days are running, every Meldiq account gets a free period of Mojo Plus, counted from when the account was created (or from the day
                free days started, for older accounts). No card is needed, and it ends by itself: nothing is charged and nothing renews.
              </p>
              <p>
                <strong>Invite links.</strong> If a new person creates their account through your personal invite link, you both get free days (theirs from
                their sign-up, instead of the usual trial), and each friend who joins adds days to yours, up to a yearly limit. An account can join through one
                invite only, and only in its first days. We may withhold invite days gained through fake or duplicate accounts.
              </p>
              <p>
                The plan and the number of days are those shown on the <Link href="/pricing">pricing page</Link> when your free period is given. We may change
                them or stop free days for new periods; a free period already given keeps its end date.
              </p>
              <CurrentFreeDays load={catalog} />
              <p>If you subscribe during a free period, your first payment is taken when the free period ends, not before.</p>
            </>
          ),
        },
        {
          id: "cancel",
          title: "Cancelling",
          body: (
            <>
              <p>
                Cancel any time: sign in, open <Link href="/account/billing">Billing</Link>, and choose &ldquo;Cancel subscription&rdquo; for PayPal. For an
                earlier subscription with a billing portal, use &ldquo;Manage payment method, invoices and cancellation&rdquo;.
              </p>
              <p>You keep the plan until the end of the period you&apos;ve paid for. It then doesn&apos;t renew, and the free tier applies.</p>
            </>
          ),
        },
        {
          id: "failed",
          title: "Failed payments",
          body: (
            <p>
              If a renewal payment fails, the payment provider may retry it, and you keep the plan for a grace period of <Detail value={op.gracePeriod} /> (each
              plan also states it before you pay). After it, the plan pauses until a payment succeeds, then it starts again. If payment can&apos;t be collected,
              the subscription ends.
            </p>
          ),
        },
        {
          id: "refunds",
          title: "Refunds",
          body: (
            <>
              <p>
                You can ask for a refund within <Detail value={op.refundWindow} /> of a payment. This never takes away rights you have under consumer law where
                you live, such as a right to withdraw from a purchase. To ask for a refund, contact <Detail value={op.supportEmail} />.
              </p>
              {op.refundRules.map((rule) => (
                <p key={rule}>
                  <Detail value={rule} />
                </p>
              ))}
              <p>A refund or chargeback is recorded with your subscription; access then follows the subscription&apos;s status.</p>
            </>
          ),
        },
        {
          id: "devices",
          title: "One plan, every device",
          body: (
            <p>
              A plan belongs to your Meldiq account, not to a device. Sign in on any supported device and the plan applies there too, without paying again.
              Purchases made through an app store, when available, may follow that store&apos;s own billing and refund rules.
            </p>
          ),
        },
        {
          id: "ends",
          title: "When a plan ends",
          body: (
            <p>
              Nothing you&apos;ve made is deleted. Your messages, files and members stay. Only adding more beyond the free tier&apos;s limits is refused until a
              plan applies again.
            </p>
          ),
        },
      ]}
    />
  );
}
