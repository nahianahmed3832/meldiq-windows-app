import Link from "next/link";
import type { ReactNode } from "react";
import { Layout } from "./Layout";
import { useOperator } from "../lib/details";
import { isPending } from "../lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  description: string;
  intro: ReactNode;
  sections: LegalSection[];
}

/** A detail the operator hasn't confirmed yet, shown as such (never a made-up value). */
export function Detail({ value }: { value: string }) {
  return isPending(value) ? <span className="placeholder">{value}</span> : <>{value}</>;
}

const RELATED = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/billing", label: "Mojo Plus terms" },
  { href: "/legal/acceptable-use", label: "Acceptable use" },
  { href: "/legal/account-deletion", label: "Account deletion & your data" },
];

/**
 * A legal page. These are drafts prepared from how Meldiq actually works, not reviewed legal advice: every page says so
 * until a qualified reviewer has approved it and the placeholders are filled (docs/LAUNCH_BLOCKERS.md).
 */
export function LegalPage({ title, description, intro, sections }: LegalPageProps) {
  const legalUpdated = useOperator().legalUpdated;
  return (
    <Layout title={title} description={description}>
      <section className="page-hero legacy-hero">
        <div className="wrap">
          <span className="eyebrow">Legal</span>
          <h1>{title}</h1>
          <p>Last updated {legalUpdated}.</p>
        </div>
      </section>
      <div className="wrap legal">
        <nav aria-label="On this page">
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ul>
          <h2 style={{ fontSize: "0.85rem", marginTop: 24, textTransform: "uppercase", letterSpacing: "0.08em" }} className="muted">
            Related
          </h2>
          <ul>
            {RELATED.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <article>
          <div className="callout warning" role="note">
            <p>
              <strong>Draft for review.</strong> This page describes how Meldiq works today, but it hasn&apos;t been reviewed by a lawyer yet and isn&apos;t
              legal advice. Highlighted details are still to be confirmed.
            </p>
          </div>
          <div style={{ marginTop: 24 }}>{intro}</div>
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={s.id}>
              <h2 id={s.id}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </Layout>
  );
}
