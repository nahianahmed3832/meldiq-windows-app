import Link from "next/link";
import { useOperator } from "../../lib/details";
import { LegalPage } from "../../components/LegalPage";

/** As implemented: meldiq_android docs/ACCOUNT_DELETION.md and the billing guard (API 0.52.0). */
export default function AccountDeletion() {
  const op = useOperator();
  return (
    <LegalPage
      title="Account deletion & your data"
      description="How to delete your Meldiq account, what deleting removes, what stays and why, and how to make other data requests."
      intro={<p>You can start deletion in Meldiq settings or send a request by email.</p>}
      sections={[
        {
          id: "how",
          title: "How to delete your account",
          body: (
            <>
              <p>
                In the Meldiq app, open Settings › Account › Delete account. You&apos;ll be asked for your password and to type your email address to confirm.
              </p>
              <p>
                You can also email <a href={`mailto:${op.privacyEmail}?subject=Meldiq%20account%20deletion`}>{op.privacyEmail}</a> with your account identifier
                and a safe reply address. You can request deletion without signing in. Use the <Link href="/legal/forms#deletion">optional deletion form</Link>{" "}
                if helpful. We may verify your identity. Keep passwords and recovery keys out of email.
              </p>
              <ul>
                <li>
                  If a subscription on your account still renews, cancel it first from <a href="/account/billing">Billing</a>. Deleting an account doesn&apos;t
                  stop a payment provider charging it, so the app asks you to cancel before it deletes anything.
                </li>
                <li>If you&apos;re the only owner of a community, make someone else an owner or delete the community first.</li>
              </ul>
            </>
          ),
        },
        {
          id: "removed",
          title: "What's removed",
          body: (
            <ul>
              <li>Your sign-in account: email address, password, sessions, passkeys, recovery codes.</li>
              <li>Your profile: names, username (others can then use it), photo and details.</li>
              <li>Your memberships in communities, groups and channels, as if you left them.</li>
              <li>Your devices, their notification addresses, and messages still waiting to be delivered.</li>
              <li>Personal records covered by the deletion workflow. Shared conversation history follows the rules below.</li>
            </ul>
          ),
        },
        {
          id: "stays",
          title: "What stays, and why",
          body: (
            <ul>
              <li>
                A “Deleted account” reference can remain so shared conversations still work for other participants. The reference may remain personal data if it
                can be linked to you.
              </li>
              <li>
                Other people may keep copies of messages or files they received. Shared conversation and community records and their files may also remain under
                the rules for those records.
              </li>
              <li>
                Billing records, such as plan, dates, amounts and payment references, are kept as needed for tax, accounting and disputes. Your payment provider
                keeps its own records under its privacy policy.
              </li>
              <li>
                Call records and audit logs may remain under the retention settings in the <Link href="/legal/privacy#retention">Privacy Policy</Link>. Backups
                and records subject to a legal hold can remain after the main account is deleted.
              </li>
            </ul>
          ),
        },
        {
          id: "other",
          title: "Other data requests",
          body: (
            <p>
              To access, correct or export your data, or for any privacy question, email <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>. Tell us if
              you cannot sign in, cancel a renewal or transfer sole ownership. We will explain available steps and any verification or retention exceptions. See
              the <Link href="/legal/privacy#rights">Privacy Policy</Link> for your rights.
            </p>
          ),
        },
      ]}
    />
  );
}
