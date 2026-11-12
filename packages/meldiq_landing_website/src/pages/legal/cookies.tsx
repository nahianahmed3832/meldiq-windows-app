import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Cookies and device storage"
      description="Storage used by the public site and web app and how to manage optional analytics."
      intro={
        <>
          <p>This notice covers meldiq.app and web.meldiq.app. You can contact {contact} about cookies or device storage.</p>
        </>
      }
      sections={[
        {
          id: "necessary",
          title: "Necessary storage",
          body: (
            <>
              <p>
                Authentication, security, device keys, account preferences, local drafts, cached content and consent choices may use cookies, sessionStorage,
                localStorage or IndexedDB. The public website&apos;s account session is stored in the browser tab. The web app separately stores an encrypted
                account session and device or account data. Web-app device storage may persist after you close the tab.
              </p>
              <dl>
                <dt>meldiq_analytics cookie</dt>
                <dd>Remembers the public-site analytics choice for 180 days.</dd>
                <dt>meldiq.analytics.preference in localStorage</dt>
                <dd>Fallback copy of the same choice and its 180-day expiry.</dd>
                <dt>Public-site sessionStorage</dt>
                <dd>Keeps a sign-in session for the tab. Ends on sign-out or tab closure under normal browser behavior</dd>
                <dt>Web-app IndexedDB and local preferences</dt>
                <dd>Supports sessions, keys, drafts, cache and preferences. Individual records follow their feature&apos;s retention and account controls</dd>
                <dt>Optional local activity and searches</dt>
                <dd>The current web settings describe a 30-day expiry and removal when the setting is turned off</dd>
              </dl>
            </>
          ),
        },
        {
          id: "analytics",
          title: "Optional analytics",
          body: (
            <>
              <p>
                When Google Analytics is enabled on the public site, it loads after you allow analytics. It measures public page visits and download clicks and
                can process browser details, technical identifiers and approximate location. It is disabled on account and billing pages. Analytics choices do
                not affect core service access.
              </p>
            </>
          ),
        },
        {
          id: "controls",
          title: "Your controls",
          body: (
            <>
              <p>
                When analytics is available, use Analytics preferences in the public website footer to allow or decline it or change your choice. Browser
                settings can remove cookies and site data. Removing web-app storage can sign you out or remove local drafts or keys. Save anything you need
                first.
              </p>
              <p>
                Payment providers and other connected services may use their own storage when you use them. See the <a href="/legal/privacy">Privacy Policy</a>{" "}
                for more about recipients and your rights.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
