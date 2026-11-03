import Link from "next/link";
import { useOperator } from "../../lib/details";
import { Detail, LegalPage } from "../../components/LegalPage";

export default function AcceptableUse() {
  const op = useOperator();
  return (
    <LegalPage
      title="Acceptable Use Policy"
      description="What isn't allowed on Meldiq, how communities moderate themselves, and how to report abuse."
      intro={
        <p>
          Meldiq is for talking with people you choose. These rules apply to everyone, in every community and conversation. They&apos;re part of the{" "}
          <Link href="/legal/terms">Terms of Service</Link>.
        </p>
      }
      sections={[
        {
          id: "not-allowed",
          title: "Not allowed",
          body: (
            <ul>
              <li>
                Anything illegal where you or the people you send it to are, including sexual content involving minors, which we report to the authorities.
              </li>
              <li>Threats, harassment, or encouraging violence or self-harm.</li>
              <li>Spam, scams, phishing, and malware.</li>
              <li>Pretending to be someone else, or misleading people about who you are in a harmful way.</li>
              <li>Sharing someone&apos;s private information without their consent.</li>
              <li>Infringing other people&apos;s copyright or other rights.</li>
              <li>Attacking, overloading or probing Meldiq&apos;s systems, or getting around limits, bans or security.</li>
              <li>Creating accounts in bulk or by automation outside an agreed program.</li>
            </ul>
          ),
        },
        {
          id: "communities",
          title: "Community rules and moderation",
          body: (
            <p>
              Community owners and moderators can add their own rules, remove messages, time people out, and remove or ban people from their community. They
              can&apos;t override this policy.
            </p>
          ),
        },
        {
          id: "report",
          title: "Reporting",
          body: (
            <p>
              Report a message or person from the app. Reports go to the community&apos;s moderators. Include the details you want moderators to review. For anything else, contact <Detail value={op.supportEmail} />.
            </p>
          ),
        },
        {
          id: "enforcement",
          title: "What we do",
          body: (
            <p>
              Depending on how serious a breach is, we may limit features, suspend or close an account, or remove a community, and we&apos;ll tell you why where
              the law and safety allow. If you think we got it wrong, contact us.
            </p>
          ),
        },
      ]}
    />
  );
}
