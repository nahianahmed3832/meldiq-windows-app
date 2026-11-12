import { LegalPage } from "../../components/LegalPage";
import { useOperator } from "../../lib/details";

export default function Page() {
  const op = useOperator();
  const contact = <a href={`mailto:${op.privacyEmail}`}>{op.privacyEmail}</a>;

  return (
    <LegalPage
      title="Privacy Policy"
      description="How Meldiq handles messages, files and account information, where data is processed and how to exercise your rights."
      intro={
        <>
          <p>
            {op.legalName} operates Meldiq and is the controller for the personal data described here. Our principal office and mailing address is {op.address}.
            Our company registration is {op.registration}. For privacy and deletion requests, email {contact}.
          </p>
          <p>This policy covers Meldiq websites, apps, accounts, communities, messages, calls and paid features.</p>
        </>
      }
      sections={[
        {
          id: "encrypted",
          title: "Messages, files and calls",
          body: (
            <>
              <p>
                Meldiq uses encrypted connections. Current chat messages are sent to and stored by the server for delivery, synchronization and search. The
                service can read stored message content.
              </p>
              <p>
                Files are encrypted before upload, but current message records can include the keys needed to open those files. Encryption of the file alone
                therefore does not prevent the Meldiq server from accessing it. Application permissions restrict which members can retrieve content. They are
                different from encryption that makes content unreadable to the provider.
              </p>
              <p>
                Call-media encryption is enabled by default in supported configurations. The call indicator shows whether call media is encrypted. The current
                key distribution has not been verified as inaccessible to the service. Participants can also record, copy or disclose content outside
                Meldiq&apos;s control.
              </p>
              <p>
                Account details, memberships, permissions, device information, routing information, billing records, feedback and reports require separate
                processing. Feedback sent to Meldiq is visible to staff. Content you deliberately send to a bot, an assistant or a support reviewer can be
                processed by that recipient.
              </p>
            </>
          ),
        },
        {
          id: "collect",
          title: "Information we process",
          body: (
            <>
              <ul>
                <li>
                  Account and authentication: email address, account identifier, name, password hash, verification events, sessions, passkey public keys and
                  security settings. Credentials entered to authenticate are processed for sign-in. Never send a password or recovery secret to support.
                </li>
                <li>
                  Profile and social features: username, display name, photo, bio, and optional details such as phone number, birthday or pronouns. We also
                  handle connections, blocks, discovery choices and presence. Information you make public may be seen or copied by others.
                </li>
                <li>
                  Communications: message text, files and their references and keys, reactions, polls, shared locations if you choose to send them, community
                  content, message timestamps, sender and conversation identifiers, delivery data, and call participation information.
                </li>
                <li>
                  Communities: membership, roles, invitations, applications, permissions, moderation actions and reports. Public community content can have a
                  wider audience than direct messages.
                </li>
                <li>
                  Saved items and optional features: collection names and message references, preferences, creator applications and evidence, feedback,
                  assistant prompts and replies, and bot interactions when used.
                </li>
                <li>
                  Technical data: IP address, device and browser details, device public keys, notification endpoints where enabled, diagnostic events, usage
                  counts and security logs.
                </li>
                <li>
                  Payments and support: purchase amount, currency, plan, transaction and subscription references, status, correspondence and request records.
                  Payment providers handle payment credentials on their own services.
                </li>
              </ul>
              <p>
                We receive information from you, devices using Meldiq, people who interact with you, community administrators, payment providers and services
                you choose to connect. Social sign-in may provide the identifier and profile fields disclosed by that provider&apos;s permission screen.
              </p>
            </>
          ),
        },
        {
          id: "why",
          title: "Purposes and legal bases",
          body: (
            <>
              <p>
                Where EU or UK data protection law applies, we assess a lawful basis for each purpose. We do not treat acceptance of this policy as blanket
                consent.
              </p>
              <dl>
                <dt>Provide an account, messages, calls and purchases</dt>
                <dd>Contract, where necessary to provide the service you request and a valid contract exists</dd>
                <dt>Secure the service, prevent abuse and handle reports</dt>
                <dd>
                  Legitimate interests in protecting users and operating a reliable service, subject to necessity and a balancing assessment, including
                  children&apos;s interests
                </dd>
                <dt>Optional analytics or consent-based features</dt>
                <dd>Consent where required. Refusal or withdrawal does not disable unrelated core functions</dd>
                <dt>Tax, accounting and legally required disclosures</dt>
                <dd>Applicable legal obligation. A foreign demand alone does not create an EU legal basis</dd>
                <dt>Respond to rights requests and resolve disputes</dt>
                <dd>Applicable legal obligation, or legitimate interests in resolving and documenting the matter, as appropriate</dd>
              </dl>
              <p>
                If a necessary field is not provided, the associated account or feature may not work. Optional profile fields are not required for basic
                messaging. Do not submit sensitive information unless needed for the feature and lawful to share. Additional legal conditions can apply to
                health, biometric and other specially protected data.
              </p>
              <p>We do not sell personal data or use private messages for advertising or to train general-purpose AI models.</p>
            </>
          ),
        },
        {
          id: "processors",
          title: "Who receives information",
          body: (
            <>
              <p>
                Your selected recipients receive messages and files. Community owners and moderators receive information needed to administer their communities
                and reports addressed to them. Public posts and profiles may be accessible beyond your connections. Review permissions before adding bots or
                external integrations. Those services may receive content you send or authorize.
              </p>
              <p>
                We use service providers for hosting, databases, file delivery, communications, security and support. We give providers only the information
                needed for their role and require appropriate contractual protections where they act for us. Payment providers and some connected services act
                independently for their own legal and operational purposes.
              </p>
              <ul>
                <li>
                  Amazon Web Services hosts our production API, website origin and primary file storage in Frankfurt. Amazon CloudFront delivers our sites and
                  media through a global network. Cloudflare provides DNS.
                </li>
                <li>Supabase provides the production PostgreSQL database in Frankfurt.</li>
                <li>Legacy hosting and recovery systems have included Hostinger and MongoDB Atlas. Historical file and backup copies remain in Singapore.</li>
                <li>
                  PayPal processes new website subscriptions. Stripe handles earlier subscriptions where applicable. Payment providers process payment
                  credentials on their own services.
                </li>
                <li>
                  Optional website analytics, when enabled and allowed, uses Google Analytics. See <a href="/legal/cookies">Cookies and device storage</a>.
                </li>
                <li>
                  Notification delivery, sign-in, and optional bots or assistants can involve their respective providers. If you choose a third-party
                  integration, review the recipient and permissions before sending it content.
                </li>
              </ul>
              <p>
                We may disclose information to professional advisers where needed, to a successor in a corporate transaction with appropriate safeguards, or
                when a binding legal obligation applies. See <a href="/legal/government-requests">Government requests</a>.
              </p>
            </>
          ),
        },
        {
          id: "transfers",
          title: "Storage and international processing",
          body: (
            <>
              <p>
                Primary file storage is in Frankfurt, Germany. Historical file and backup copies remain in Singapore. Global delivery networks, payment
                services, integrations, recipients and authorized support access may involve other locations.
              </p>
              <p>
                Where a restricted transfer is necessary, applicable law requires a valid transfer mechanism and any necessary safeguards. Email {contact} to
                ask about a specific recipient, country, or applicable safeguard and how to obtain a copy.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep information",
          body: (
            <>
              <p>
                Account records generally remain while your account is active. Chat history and completed uploads may remain until deleted under the applicable
                account, conversation or file controls. A disappearing message can leave the uploaded file, backup or recipient copy in place.
              </p>
              <p>
                The legacy delivery queue and unfinished uploads have a configured seven-day limit. This is separate from the retention of stored conversation
                history. The current production call-record and audit-log retention settings are 36,500 days. Billing records are kept as required for tax,
                accounting and disputes.
              </p>
              <p>
                Other records are kept according to their purpose and any applicable legal requirements. Backup copies or records subject to a legal hold can
                remain after deletion. See <a href="/legal/account-deletion">Account deletion and data requests</a>.
              </p>
            </>
          ),
        },
        {
          id: "rights",
          title: "Your choices and rights",
          body: (
            <>
              <p>
                Use Settings to manage profile visibility, security, notifications, saved items and available activity controls. My Account provides a data
                download and account-deletion entry point. A browser export may not include every record held by Meldiq. You can request a fuller response by
                email.
              </p>
              <p>
                Depending on applicable law, you may request access, correction, deletion, portability, restriction, or object to processing. You can withdraw
                consent for optional processing at any time without affecting earlier lawful processing. You may object to direct marketing, and to other
                processing based on legitimate interests where applicable. We do not retaliate for exercising privacy rights.
              </p>
              <p>
                Email {contact}. You may use the optional request form. We use proportionate identity checks and will not ask for passwords, private keys or a
                full payment-card number. Authorized representatives may act with appropriate proof. We respond without undue delay and within the applicable
                legal deadline. EU and UK requests ordinarily receive a response within one month, with lawful extensions explained within that initial period.
                We explain refusals and available appeal or complaint routes.
              </p>
              <p>
                You may complain to the authority where you live, work or believe an infringement occurred. Automated rate limits or account restrictions can
                affect your access. Contact us to challenge a decision and request human review where applicable.
              </p>
              <p>
                <a href="/legal-forms/privacy-rights-request.pdf">Privacy rights request (fillable PDF)</a>
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Young people and policy changes",
          body: (
            <>
              <p>
                You must be at least {op.minimumAge} to use Meldiq. Higher local age limits and any required parental permission apply. See{" "}
                <a href="/legal/young-people">Privacy for young people and parents</a>. We give notice of material policy changes and request new consent where
                required.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
