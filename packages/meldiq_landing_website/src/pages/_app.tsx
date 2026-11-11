import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { isSpanishPage } from "../lib/seo";
import "../styles/site.css";
import "../styles/marketing.css";
import "../styles/reference-home.css";
import "../styles/refresh.css";

export default function MeldiqSite({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    document.documentElement.lang = isSpanishPage(router.pathname) ? "es" : "en";
  }, [router.pathname]);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
