import Link from "next/link";
import { useOperator } from "../../lib/details";
import { Detail, LegalPage } from "../../components/LegalPage";

/** As implemented: meldiq_android docs/ACCOUNT_DELETION.md and the billing guard (API 0.52.0). */
export default function AccountDeletion() {
  const op = useOperator();
  return (
    <LegalPage
      title="Account deletion & your data"
      description="How to delete your Meldiq account, what deleting removes, what stays and why, and how to make other data requests."
      intro={<p>You can delete your Meldiq account yourself at any time. Here is what happens.</p>}
      sections={[
        {
          id: "how",
          title: "How to delete your account",
          body: (
            <>
              <p>
                In the Meldiq app, open Settings › Account › Delete account. You&apos;ll be asked for your password and to type your email address to confirm.
              </p>
              <ul>
                <li>
                  If a subscription on your account still renews, cancel it first from <a href="/account/billing">Billing</a>. Deleting an account
                  doesn&apos;t stop a payment provider charging it, so the app asks you to cancel before it deletes anything.
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
              <li>Your encrypted message history on our servers.</li>
            </ul>
          ),
        },
        {
          id: "stays",
          title: "What stays, and why",
          body: (
            <ul>
              <li>
                An anonymous placeholder, so a conversation with you stays one conversation for the other person, who sees &ldquo;Deleted account&rdquo;. It
                holds no name, email or profile.
              </li>
              <li>Messages other people already received are on their devices, as with any messaging app.</li>
              <li>
                Billing records (plan, dates, amounts and payment-provider references, never card numbers) for as long as tax and accounting law requires:{" "}
                <Detail value={op.billingRecordRetention} />. The payment provider keeps its own records under its privacy policy.
              </li>
              <li>Security and audit logs, without message content, for up to a year.</li>
            </ul>
          ),
        },
        {
          id: "other",
          title: "Other data requests",
          body: (
            <p>
              To access, correct or export your data, or for any privacy question, contact <Detail value={op.privacyEmail} />. See the{" "}
              <Link href="/legal/privacy#rights">Privacy Policy</Link> for your rights.
            </p>
          ),
        },
      ]}
    />
  );
}
