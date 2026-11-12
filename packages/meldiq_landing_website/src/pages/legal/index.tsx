import Link from "next/link";
import { LEGAL_LINKS, LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function LegalCenter() {
  const { legalName, address, registration, privacyEmail } = useOperator();
  return (
    <LegalPage
      title="Legal & privacy center"
      description="Meldiq’s terms, privacy and security notices, safety reporting and forms for your requests."
      intro={
        <p>
          Meldiq is operated by {legalName}, {registration}. Our principal office and mailing address is {address}. Email{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> for support, privacy requests or legal notices.
        </p>
      }
      sections={[
        {
          id: "policies",
          title: "Policies and notices",
          body: (
            <ul>
              {LEGAL_LINKS.filter(({ href }) => href !== "/legal").map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
