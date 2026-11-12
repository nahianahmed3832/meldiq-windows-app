import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Privacy for young people and parents"
      description="Age requirements, parental permission and privacy settings for young Meldiq users."
      intro={
        <>
          <p>
            You must be at least {op.minimumAge} to use Meldiq. Some countries set a higher minimum age or require permission from a parent or guardian. Obtain
            verified permission before use where required.
          </p>
        </>
      }
      sections={[
        {
          id: "eligibility",
          title: "Age and permission",
          body: (
            <>
              <p>
                A parent cannot waive a higher legal minimum age. To ask about permission or report an underage account, email {contact}. Include the country
                and the relevant account identifier. We will explain any verification needed. Keep identity documents out of ordinary email.
              </p>
              <p>
                <a href="/legal-forms/parent-or-guardian-permission.pdf">Parent or guardian permission (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "What people can see",
          body: (
            <>
              <p>
                Other people can see the details you share with them and what you post publicly. Meldiq’s servers can read stored chat messages. Keep your home
                address, school schedule, passwords, recovery codes and payment details private. Other people can save what you send or show them.
              </p>
            </>
          ),
        },
        {
          id: "controls",
          title: "Your choices",
          body: (
            <>
              <p>
                Check Privacy and security settings for who can contact you or view your profile. Block or report someone who makes you feel unsafe. You can ask
                to see, correct or delete your information by emailing {contact}. When a parent or guardian asks for data, we consider their authority, your
                privacy and safety, and applicable law.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
