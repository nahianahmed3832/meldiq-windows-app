import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SITE } from "../lib/site";
import { gamingAlternates, isSpanishPage } from "../lib/seo";
import { useSignedIn } from "./useAccount";
import { CloseIcon, MenuIcon } from "./Icons";
import { HEADER_LINKS as NAV } from "../content/navigation";
import { MarketingFooter } from "./MarketingFooter";

interface LayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  noindex?: boolean;
  landing?: boolean;
}
function Seo({ title, description, noindex }: Omit<LayoutProps, "children">) {
  const { pathname } = useRouter();
  const canonical = new URL(pathname, SITE.url).href;
  const spanish = isSpanishPage(pathname);
  const full = pathname === "/" ? title : `${title} | Meldiq`;
  const image = new URL("/meldiq-og.png", SITE.url).href;
  const alternates = gamingAlternates(pathname);
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: new URL("/", SITE.url).href,
    description,
  };
  return (
    <Head>
      <title>{full}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={SITE.name} />
          <meta property="og:locale" content={spanish ? "es_ES" : "en_US"} />
          <meta property="og:title" content={full} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Meldiq" />
          <meta name="twitter:card" content="summary_large_image" />
        </>
      )}
      {alternates.map(([language, path]) => (
        <link key={language} rel="alternate" hrefLang={language} href={new URL(path, SITE.url).href} />
      ))}
      {pathname === "/" ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }} /> : null}
    </Head>
  );
}
function Header({ light, toggleTheme }: { light: boolean; toggleTheme: () => void }) {
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signedIn = useSignedIn();
  const button = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (e: Event) => {
      if (e.target instanceof Node && !nav.current?.contains(e.target) && !button.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header lang="en" className={`site-header${scrolled ? " scrolled" : ""}`}>
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label="Meldiq home">
          <img src="/meldling-128.png" alt="" width={34} height={34} />
          <span>
            meldiq<span className="brand-dot">.</span>
          </span>
        </Link>
        <button type="button" className="theme-switch" onClick={toggleTheme} aria-label={light ? "Switch to dark mode" : "Switch to light mode"}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {light ? (
              <path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
              </>
            )}
          </svg>
        </button>
        <button
          ref={button}
          className="menu-button"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="navigation"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <nav ref={nav} id="navigation" className={open ? "is-open" : ""} aria-label="Main navigation">
          <div className="nav-links">
            {["/download", "/developers", "/pricing"]
              .map((href) => NAV.find((n) => n.href === href)!)
              .map((n) => (
                <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
                  {n.label}
                </Link>
              ))}
          </div>
          <div className="nav-actions">
            {signedIn ? (
              <a className="sign-in" href="/account">
                Account
              </a>
            ) : (
              <a className="sign-in" href={SITE.webAppUrl}>
                {pathname === "/" ? "Log in" : "Open Meldiq"}
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
export function Layout({ title, description, children, noindex, landing = false }: LayoutProps) {
  const { pathname } = useRouter();
  const spanish = isSpanishPage(pathname);
  const [light, setLight] = useState(false);
  useEffect(() => {
    try {
      setLight(localStorage.getItem("meldiq.marketing.theme") === "light");
    } catch {
      /* Optional preference. */
    }
  }, [landing]);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    try {
      localStorage.setItem("meldiq.marketing.theme", next ? "light" : "dark");
    } catch {
      /* Optional preference. */
    }
  };
  return (
    <div className={`marketing-site reference-home meldiq-refresh${landing ? " minimal-landing" : ""}${light ? " is-light" : ""}`} id="top">
      <Seo title={title} description={description} noindex={noindex} />
      <a className="skip-link" href="#main">
        {spanish ? "Saltar al contenido" : "Skip to content"}
      </a>
      <Header light={light} toggleTheme={toggleTheme} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter analyticsPath={noindex ? undefined : pathname} />
    </div>
  );
}
