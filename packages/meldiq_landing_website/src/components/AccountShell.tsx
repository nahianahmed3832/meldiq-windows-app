import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { Layout } from "./Layout";
import { browserSession } from "../lib/session";

interface AccountShellProps {
  title: string;
  children: ReactNode;
}

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/billing", label: "Billing" },
];

/** The signed-in area's frame: its navigation and signing out. */
export function AccountShell({ title, children }: AccountShellProps) {
  const router = useRouter();
  async function signOut() {
    await browserSession().signOut();
    void router.replace("/");
  }
  return (
    <Layout title={title} description="Your Meldiq account and subscription." noindex>
      <div className="wrap account-layout">
        <nav className="account-nav" aria-label="Account">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={router.pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <button type="button" className="btn btn-ghost" style={{ justifyContent: "flex-start", borderRadius: 8 }} onClick={signOut}>
            Sign out
          </button>
        </nav>
        <div className="stack">{children}</div>
      </div>
    </Layout>
  );
}

export function LoadingCard() {
  return (
    <div className="card stack" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ width: "40%" }} />
      <div className="skeleton" />
      <div className="skeleton" style={{ width: "70%" }} />
    </div>
  );
}
