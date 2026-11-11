import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout } from "./Layout";
import { PageIndex } from "./PageIndex";
import { isSpanishPage } from "../lib/seo";
import { SITE } from "../lib/site";

export interface GuideSection {
  title: string;
  text: string;
  items?: string[];
  href?: string;
  label?: string;
}

export function GuidePage({
  title,
  eyebrow,
  heading,
  description,
  sections,
  children,
}: {
  title: string;
  eyebrow: string;
  heading: string;
  description: string;
  sections: GuideSection[];
  children?: ReactNode;
}) {
  const { pathname } = useRouter();
  const spanish = isSpanishPage(pathname);
  const kind = ["/security", "/tutorials", "/voice-video-screen-sharing", "/compare/discord"].includes(pathname)
    ? "handbook"
    : pathname === "/roadmap"
      ? "timeline"
      : pathname === "/brand"
        ? "brand"
        : "product";
  const action =
    pathname === "/roadmap"
      ? { href: "/download", label: "See available apps" }
      : pathname === "/brand"
        ? { href: "/meldling-512.png", label: "Download Meldling PNG" }
        : pathname === "/security"
          ? { href: "/legal/privacy", label: "Read the Privacy Policy" }
          : sections.find((s) => s.href);
  const rows = sections.map((section, index) => {
    const status = /^(Available|Planned):/.exec(section.title)?.[1];
    return (
      <section className="guide-row" id={`guide-${index + 1}`} key={section.title}>
        <span className="guide-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="guide-row-title">
          {status ? <span className={`roadmap-status ${status.toLowerCase()}`}>{status}</span> : null}
          <h2>{status ? section.title.replace(/^[^:]+: /, "") : section.title}</h2>
        </div>
        <div>
          <p>{section.text}</p>
          {section.items ? (
            <ul className="checklist">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.href ? (
            <a className="inline-link" href={section.href}>
              {section.label ?? "Learn more"} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </section>
    );
  });
  return (
    <Layout title={title} description={description}>
      <div className={`guide-template guide-${kind}`}>
        <section className="interior-hero guide-hero wrap">
          <Link href="/" className="breadcrumb">
            {spanish ? "Inicio" : "Home"} / {title}
          </Link>
          <span className="ref-kicker">{eyebrow}</span>
          <h1>{heading}</h1>
          <p>{description}</p>
          {action?.href ? (
            <a className="button primary" href={action.href} download={pathname === "/brand" ? "meldiq-meldling.png" : undefined}>
              {action.label ?? "Open Meldiq"} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </section>
        {children}
        {kind === "handbook" ? (
          <div className="reading-layout wrap">
            <PageIndex spanish={spanish} items={sections.map((s, i) => ({ id: `guide-${i + 1}`, label: s.title }))} />
            <div className="guide-sections">{rows}</div>
          </div>
        ) : (
          <div className="guide-sections wrap">{rows}</div>
        )}
        <section className="guide-end wrap">
          <img src="/meldling-128.png" width={56} height={56} alt="" loading="lazy" />
          <div>
            <h2>{spanish ? "Reúne a tu grupo." : "Make yourself at home."}</h2>
            <p>{spanish ? "Abre Meldiq en tu navegador." : "Your next conversation is only a tab away."}</p>
          </div>
          <a className="button secondary" href={SITE.webAppUrl}>
            {spanish ? "Abrir Meldiq" : "Open Meldiq"} <span aria-hidden="true">↗</span>
          </a>
        </section>
      </div>
    </Layout>
  );
}
