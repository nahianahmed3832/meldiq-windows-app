import type { ReactNode } from "react";
import Link from "next/link";
import { Layout } from "./Layout";
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
  return (
    <Layout title={title} description={description}>
      <section className="guide-hero wrap">
        <Link href="/" className="breadcrumb">
          Home / {title}
        </Link>
        <span className="ref-kicker">{eyebrow}</span>
        <h1>{heading}</h1>
        <p>{description}</p>
      </section>
      {children}
      <div className="guide-sections wrap">
        {sections.map((section, index) => (
          <section className="guide-row" key={section.title}>
            <span className="guide-index">{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.title}</h2>
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
        ))}
      </div>
      <section className="guide-end wrap">
        <img src="/meldling-128.png" width={56} height={56} alt="" loading="lazy" />
        <div>
          <h2>Make yourself at home.</h2>
          <p>Your next conversation is only a tab away.</p>
        </div>
        <a className="button primary" href={SITE.webAppUrl}>
          Open Meldiq <span aria-hidden="true">↗</span>
        </a>
      </section>
    </Layout>
  );
}
