import { Layout } from "../components/Layout";
import { SupportContact } from "../components/MarketingStatus";
export default function Page() {
  return (
    <Layout
      title="A little help with Meldiq"
      description="Find help with Meldiq accounts, password recovery, billing, community moderation, privacy and account deletion."
    >
      <section className={"page-hero wrap"}>
        <a href={"/"} className={"breadcrumb"}>
          {"Home "}
          <span>{"/"}</span>
          {" Support"}
        </a>
        <span className={"eyebrow"}>{"Support"}</span>
        <h1>How can we help?</h1>
        <p>{"Let’s get you pointed in the right direction."}</p>
        <p>
          <a href="https://status.meldiq.app">Check service health and active incidents →</a>
        </p>
        <a className={"button secondary"} href={"/faq"}>
          {"Search all help topics"}
          <svg
            className={"icon"}
            width={24}
            height={24}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"1.7"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            aria-hidden={"true"}
          >
            <path d={"M5 12h14M13 6l6 6-6 6"}></path>
          </svg>
        </a>
      </section>
      <section className={"support-grid wrap"}>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <circle cx={"8"} cy={"8"} r={"5"}></circle>
              <path d={"m12 12 9 9M16 16l3-3M19 19l3-3"}></path>
            </svg>
          </span>
          <h2>{"Account & sign-in"}</h2>
          <p>{"Password recovery, account access and ways to keep your account secure."}</p>
          <a className={"button text-link"} href={"/forgot-password"}>
            {"Reset your password"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"}></path>
            </svg>
          </span>
          <h2>{"Meldiq Plus & billing"}</h2>
          <p>{"Use the original billing page for existing subscriptions, invoices and cancellation."}</p>
          <a className={"button text-link"} href={"/account/billing"}>
            {"Open your billing account"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <circle cx={"9"} cy={"8"} r={"4"}></circle>
              <path d={"M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M22 21v-3a6 6 0 0 0-4-6"}></path>
            </svg>
          </span>
          <h2>{"Communities & moderation"}</h2>
          <p>{"Get help with invitations, roles, permissions and community tools."}</p>
          <a className={"button text-link"} href={"/faq?category=Communities"}>
            {"Explore community help"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"}></path>
              <path d={"m8 12 3 3 5-6"}></path>
            </svg>
          </span>
          <h2>{"Privacy & your data"}</h2>
          <p>{"Understand encryption, visible metadata and your data rights."}</p>
          <a className={"button text-link"} href={"/legal/privacy#rights"}>
            {"Read about your rights"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M20 4c-3-2-6 0-8 2-2-2-5-4-8-2s-3 6-1 9l9 9 9-9c2-3 2-7-1-9Z"}></path>
            </svg>
          </span>
          <h2>{"Report abuse"}</h2>
          <p>{"Report a message or person in Meldiq. Reports go to the community’s moderators."}</p>
          <a className={"button text-link"} href={"/legal/acceptable-use#report"}>
            {"How to report"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
        <article className={"support-card"}>
          <span className={"icon-box"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M14 2H5v20h14V7l-5-5Z"}></path>
              <path d={"M14 2v6h5M8 13h8M8 17h6"}></path>
            </svg>
          </span>
          <h2>{"Account deletion"}</h2>
          <p>{"Learn how to delete your account, what is removed and what may remain."}</p>
          <a className={"button text-link"} href={"/legal/account-deletion"}>
            {"Account & data information"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </article>
      </section>
      <section className={"contact-section wrap"} id={"contact"}>
        <div>
          <img className={""} src={"/assets/meldling-512.png"} width={130} height={130} alt={"Meldling, Meldiq’s mascot"} loading={"lazy"} decoding={"async"} />
        </div>
        <div>
          <span className={"eyebrow"}>{"STILL NEED A HAND?"}</span>
          <h2>
            {"Contact "}
            <em>{"support."}</em>
          </h2>
          <SupportContact />
          <p className={"fine-print"}>
            {
              "For now, use the help topics above, the existing account tools, or in-app reporting for community issues. Never share passwords, recovery codes or card numbers."
            }
          </p>
          <a className={"button secondary"} href={"/faq"}>
            {"Browse questions & answers"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
        </div>
      </section>
    </Layout>
  );
}
