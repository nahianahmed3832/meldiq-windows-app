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

export const LEGAL_LINKS = [
  { href: "/legal", label: "Legal & privacy center" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/billing", label: "Meldiq Plus terms" },
  { href: "/legal/acceptable-use", label: "Acceptable use" },
  { href: "/legal/account-deletion", label: "Account deletion & your data" },
  { href: "/legal/cookies", label: "Cookies and device storage" },
  { href: "/security", label: "Security and encryption" },
  { href: "/legal/young-people", label: "Young people and parents" },
  { href: "/legal/content-removal", label: "Report content or request removal" },
  { href: "/legal/government-requests", label: "Government requests" },
  { href: "/legal/forms", label: "Request forms" },
];

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
            {LEGAL_LINKS.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <article>
          <div>{intro}</div>
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
