import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Government and legal requests"
      description="How GriipBuddy LLC assesses government requests for Meldiq data."
      intro={
        <>
          <p>
            GriipBuddy LLC assesses requests individually. We do not give public authorities direct access or routine feeds. We limit any disclosure to what
            applicable law requires or permits in a verified emergency.
          </p>
        </>
      }
      sections={[
        {
          id: "review",
          title: "Submitting and reviewing requests",
          body: (
            <>
              <p>
                Requests should be directed to {contact} and identify the requesting authority, verified official contact, legal process, jurisdiction, specific
                account or content, requested data and time period, legal basis and response deadline. Formal service must follow applicable law.
              </p>
              <p>
                We verify authenticity and authority, assess the applicable law and seek legal advice where necessary. We seek clarification, narrowing or
                challenge of requests that are invalid, unsupported, disproportionate, overbroad or inconsistent with applicable rights. We disclose only the
                data legally required and available, using an appropriate secure method and recording the basis and scope.
              </p>
              <p>
                Foreign demands involving EU or UK data require an independent legal assessment, including applicable transfer restrictions. A foreign order is
                not, by itself, automatic authorization for a restricted international transfer.
              </p>
            </>
          ),
        },
        {
          id: "preservation",
          title: "Preservation, emergency requests and mandatory reports",
          body: (
            <>
              <p>
                Applicable law can require preservation, disclosure or reporting. We document the scope and duration of lawful preservation holds. For
                emergencies, specify the imminent threat, the person at risk, the data requested and why ordinary process is insufficient. We verify the facts
                and assess necessity and proportionality under applicable law.
              </p>
            </>
          ),
        },
        {
          id: "notice",
          title: "User notice and records",
          body: (
            <>
              <p>
                Where lawful and safe, we notify affected users before disclosure and allow an opportunity to seek relief. Notice may be delayed if prohibited
                or if it would create a serious, documented safety risk. the restriction is reviewed when circumstances change. We record requests, legal
                review, objections, disclosures, holds and notification decisions in a restricted log.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
