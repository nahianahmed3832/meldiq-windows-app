import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Report content or request removal"
      description="Report illegal content, nonconsensual intimate images or copyright infringement, or ask for review of a decision."
      intro={
        <>
          <p>Anyone can contact Meldiq about a safety or copyright concern. Include where the content appears and how we can safely reach you.</p>
        </>
      }
      sections={[
        {
          id: "report",
          title: "Report content or appeal",
          body: (
            <>
              <p>
                Email {contact}. Include the Meldiq link, account or message identifier, the issue and why you believe the material is unlawful if applicable.
                To appeal, include the decision or reference and explain what you want reviewed. Share only relevant details. Avoid forwarding illegal material
                or unrelated personal data.
              </p>
              <p>
                <a href="/legal-forms/content-report-or-appeal.pdf">Content report or appeal (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "intimate-images",
          title: "Urgent removal of intimate images",
          body: (
            <>
              <p>
                If someone shared an intimate photo or video of you without your permission, including a digital forgery, you or an authorized representative
                can ask us to remove it. Email {contact} with the subject “Urgent intimate image removal.” You can submit a request without a Meldiq account.
              </p>
              <p>
                Include a safe contact method, a physical or electronic signature, enough information to find the image or video, and your good-faith statement
                that it was posted without the depicted person’s consent. Explain your authority if acting for someone else. Identify the location without
                attaching or forwarding the image.
              </p>
              <p>
                Where the US TAKE IT DOWN Act applies, valid requests must be addressed within 48 hours, including reasonable efforts to find and remove known
                identical copies.
              </p>
              <p>
                <a href="/legal-forms/urgent-intimate-image-removal.pdf">Urgent intimate image removal (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "copyright",
          title: "Copyright notices and counter-notices",
          body: (
            <>
              <p>
                For a copyright complaint, email {contact}. Identify the copyrighted work, the material and where to find it. Include your contact details and
                signature, a good-faith statement that the use is unauthorized, and a statement under penalty of perjury that the notice is accurate and you can
                act for the copyright owner.
              </p>
              <p>
                To challenge a removal, include the notice reference and the reasons for review. A formal US DMCA counter-notice has additional requirements and
                may be forwarded to the complaining party where required.
              </p>
              <p>
                <a href="/legal-forms/copyright-infringement-notice.pdf">Copyright infringement notice (fillable PDF)</a> ·{" "}
                <a href="/legal-forms/copyright-counter-notice.pdf">Copyright counter-notice (fillable PDF)</a>
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
