import Link from "next/link";
import { useOperator } from "../../lib/details";
import { Detail, LegalPage } from "../../components/LegalPage";

/** Written from meldiq_android docs/SECURITY.md, RETENTION.md, ACCOUNT_DELETION.md and BILLING.md (what the system does). */
export default function Privacy() {
  const op = useOperator();
  return (
    <LegalPage
      title="Privacy Policy"
      description="What Meldiq collects, what it can't see because it's encrypted, who processes it, how long it's kept, and your rights."
      intro={
        <p>
          This policy explains what personal data Meldiq handles and why. The controller is <Detail value={op.legalName} />, <Detail value={op.address} />.
          Privacy contact: <Detail value={op.privacyEmail} />. <Detail value={op.dpo} />
        </p>
      }
      sections={[
        {
          id: "encrypted",
          title: "What we can't see",
          body: (
            <p>
              Message text, attachments, reactions, edits, read receipts and call media (with call encryption on, the default) are end-to-end encrypted on your
              devices. Our servers store and relay only the encrypted form and can&apos;t read it. Your private keys never leave your devices.
            </p>
          ),
        },
        {
          id: "collect",
          title: "What we collect",
          body: (
            <ul>
              <li>
                <strong>Account:</strong> your email address, name, a hash of your password, passkey public keys, two-step sign-in settings, and your signed-in
                sessions.
              </li>
              <li>
                <strong>Profile:</strong> username, display name and the profile details and photo you choose to add.
              </li>
              <li>
                <strong>Communities:</strong> the communities, channels and roles you&apos;re in, invitations, bans and reports. The server needs these to
                decide who may do what.
              </li>
              <li>
                <strong>Routing metadata:</strong> who sends to which conversation, when, and how large each message is; delivery receipts; IP addresses; online
                status.
              </li>
              <li>
                <strong>Devices:</strong> device public keys and, if you allow notifications, a push address for each device.
              </li>
              <li>
                <strong>Billing:</strong> if you buy a plan, references to your payment-provider account, subscription and transactions, the plan, its status
                and dates, and amounts. Never card numbers: the payment provider handles payment details on its own pages.
              </li>
              <li>
                <strong>Operations:</strong> counts and sizes for usage limits, security and audit logs without message content.
              </li>
            </ul>
          ),
        },
        {
          id: "why",
          title: "Why we use it",
          body: (
            <p>
              To provide Meldiq (your account, delivering messages and calls, enforcing community permissions), to keep it secure and stop abuse, to bill paid
              plans and meet accounting duties, and to answer you when you contact us. We don&apos;t sell your data or use it for advertising. The legal bases
              for each use, where the law requires them, are <Detail value={op.legalBases} />.
            </p>
          ),
        },
        {
          id: "processors",
          title: "Who processes it for us",
          body: (
            <ul>
              <li>Hostinger: the server that runs Meldiq&apos;s API.</li>
              <li>MongoDB Atlas: part of Meldiq&apos;s database.</li>
              <li>Amazon Web Services: encrypted file storage (Singapore region) and account emails.</li>
              <li>Cloudflare: DNS for meldiq.app.</li>
              <li>PayPal: payment authorization, subscriptions, receipts and payment verification for new website purchases.</li>
              <li>Stripe: billing records and the customer portal for earlier Stripe subscriptions, where applicable.</li>
              <li>
                Notification wake-ups run through Meldiq&apos;s own push server, which learns only a random device address and when it was woken, never content.
                If Google Firebase Cloud Messaging is switched on later, this list will say so first.
              </li>
            </ul>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <ul>
              <li>Encrypted messages waiting for a device: until delivered, at most 7 days.</li>
              <li>Encrypted file uploads: 7 days, or up to a year after you last asked to keep one in your history.</li>
              <li>Encrypted history you keep: until you delete it or your account.</li>
              <li>Call records: 90 days. Audit logs: 365 days.</li>
              <li>
                Billing records: as long as tax and accounting law requires: <Detail value={op.billingRecordRetention} />.
              </li>
              <li>Your account: until you delete it.</li>
            </ul>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <p>
              Depending on where you live, you can ask to access, correct, export or delete your data, object to or restrict some uses, and complain to a data
              protection authority. You can delete your account yourself (<Link href="/legal/account-deletion">how</Link>). For anything else, write to{" "}
              <Detail value={op.privacyEmail} />. We&apos;ll check it&apos;s you before acting on a request.
            </p>
          ),
        },
        {
          id: "website",
          title: "This website",
          body: (
            <p>
              The website uses no advertising or tracking cookies and loads no third-party scripts. When you sign in here, your session is kept in this browser
              tab only and ends when you close it or sign out. PayPal hosts new subscription payment pages under its own privacy policy. Earlier Stripe payment
              pages follow Stripe&apos;s privacy policy.
            </p>
          ),
        },
        {
          id: "transfers",
          title: "International transfers and changes",
          body: (
            <p>
              Your data may be processed in countries other than yours by the providers above. <Detail value={op.transferSafeguards} /> We&apos;ll tell you
              about material changes to this policy before they apply.
            </p>
          ),
        },
      ]}
    />
  );
}
