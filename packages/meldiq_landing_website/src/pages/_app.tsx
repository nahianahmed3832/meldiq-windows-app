import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/site.css";
import "../styles/marketing.css";
import "../styles/reference-home.css";
import "../styles/refresh.css";

export default function MeldiqSite({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
