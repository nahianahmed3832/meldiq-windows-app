import { Head, Html, Main, NextScript, type DocumentProps } from "next/document";
import { isSpanishPage } from "../lib/seo";

/** The shell of every page (rendered at build time). No inline script: the CSP allows only this site's own files. */
export default function Document({ __NEXT_DATA__ }: DocumentProps) {
  return (
    <Html lang={isSpanishPage(__NEXT_DATA__.page) ? "es" : "en"}>
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#10101b" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-light-32.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-dark-32.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-light-192.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-dark-192.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-light-192.png" />
        <link rel="apple-touch-icon" href="/meldling-180.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
