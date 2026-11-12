import Link from "next/link";
import { useOperator } from "../../lib/details";
import { Detail, LegalPage } from "../../components/LegalPage";

export default function Terms() {
  const op = useOperator();
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms for using Meldiq: your account, your content, acceptable use, Meldiq Plus, availability, and how these terms change."
      intro={
        <p>
          These terms are an agreement between you and <Detail value={op.legalName} /> (&ldquo;Meldiq&rdquo;, &ldquo;we&rdquo;), with a principal office and
          mailing address at <Detail value={op.address} /> ({op.registration}), for using Meldiq&apos;s apps, website and services (&ldquo;Meldiq&rdquo;). By
          creating an account or using Meldiq you agree to them.
        </p>
      }
      sections={[
        {
          id: "account",
          title: "Your account",
          body: (
            <>
              <p>
                You need an account to use Meldiq. You must be at least <Detail value={op.minimumAge} /> and meet any higher local age limit. Obtain verified
                parent or guardian permission before use when required. See <Link href="/legal/young-people">Privacy for young people and parents</Link>. Give a
                working email address.
              </p>
              <p>
                You&apos;re responsible for keeping your password, passkeys, recovery codes and recovery key safe. Some older encrypted history or data held
                only on your device may be lost if you lose its keys. See <Link href="/security">Security and encryption</Link> for how the current service
                handles messages, files and calls.
              </p>
            </>
          ),
        },
        {
          id: "content",
          title: "Your content",
          body: (
            <p>
              What you send stays yours. You give Meldiq only the permission it needs to store, relay and deliver it to the people you send it to. You&apos;re
              responsible for what you share and must have the right to share it.
            </p>
          ),
        },
        {
          id: "use",
          title: "Acceptable use",
          body: (
            <p>
              You must follow the <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>. Community owners and moderators can set their own rules and
              remove people from their communities. We may limit or suspend accounts that break these terms or the law, and we will tell you why where the law
              and safety allow.
            </p>
          ),
        },
        {
          id: "plans",
          title: "Free tier and Meldiq Plus",
          body: (
            <p>
              Meldiq has a free tier. Meldiq Plus is an optional subscription, described, with its price and renewal terms, before you pay. Buying, renewing,
              cancelling and refunds are covered by the <Link href="/legal/billing">subscription terms</Link>, which are part of these terms. Payments for new
              website subscriptions are processed by PayPal.
            </p>
          ),
        },
        {
          id: "availability",
          title: "Changes and availability",
          body: (
            <p>
              We keep improving Meldiq, so features can change. We work to keep it running and secure, but to the extent the law allows we provide it &ldquo;as
              is&rdquo;, without promising it will always be available or error-free. Its encryption hasn&apos;t had an independent security audit yet.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Liability",
          body: (
            <p>
              Nothing in these terms limits liability that can&apos;t be limited by law, or your rights as a consumer. Applicable law determines liability and
              the courts that can hear a dispute. You keep any mandatory protections that apply where you live.
            </p>
          ),
        },
        {
          id: "ending",
          title: "Ending your use",
          body: (
            <p>
              You can stop using Meldiq and <Link href="/legal/account-deletion">delete your account</Link> at any time. Cancel a renewing subscription first.
              We may end these terms if you seriously or repeatedly break them.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <>
              <p>If we change these terms in a way that matters, we&apos;ll tell you before the change applies.</p>
              <p>
                Questions? Email <a href={`mailto:${op.supportEmail}`}>{op.supportEmail}</a>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
