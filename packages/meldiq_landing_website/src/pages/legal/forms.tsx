import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Request forms"
      description="Download fillable forms for privacy, account deletion, billing, parent permission and safety requests."
      intro={
        <>
          <p>
            Fill out the form that fits your request, save it and email it to {contact}. You may also describe your request in an email. Use a safe reply
            address. Keep passwords, recovery keys, payment credentials and identity documents out of ordinary email.
          </p>
        </>
      }
      sections={[
        {
          id: "rights",
          title: "Privacy rights request",
          body: (
            <>
              <p>
                <a href="/legal-forms/privacy-rights-request.pdf">Privacy rights request (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "deletion",
          title: "Account and data deletion",
          body: (
            <>
              <p>
                <a href="/legal-forms/account-and-data-deletion.pdf">Account and data deletion (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "billing",
          title: "Cancellation, refund or withdrawal",
          body: (
            <>
              <p>
                <a href="/legal-forms/cancellation-refund-or-withdrawal.pdf">Cancellation, refund or withdrawal (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "parents",
          title: "Parent or guardian permission",
          body: (
            <>
              <p>
                <a href="/legal-forms/parent-or-guardian-permission.pdf">Parent or guardian permission (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "content",
          title: "Content report or appeal",
          body: (
            <>
              <p>
                <a href="/legal-forms/content-report-or-appeal.pdf">Content report or appeal (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "intimate-images",
          title: "Urgent intimate image removal",
          body: (
            <>
              <p>
                <a href="/legal-forms/urgent-intimate-image-removal.pdf">Urgent intimate image removal (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "copyright",
          title: "Copyright infringement notice",
          body: (
            <>
              <p>
                <a href="/legal-forms/copyright-infringement-notice.pdf">Copyright infringement notice (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "counter-notice",
          title: "Copyright counter-notice",
          body: (
            <>
              <p>
                <a href="/legal-forms/copyright-counter-notice.pdf">Copyright counter-notice (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security vulnerability report",
          body: (
            <>
              <p>
                <a href="/legal-forms/security-vulnerability-report.pdf">Security vulnerability report (fillable PDF)</a>
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
