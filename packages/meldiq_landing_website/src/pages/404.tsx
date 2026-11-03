import Link from "next/link";
import { Layout } from "../components/Layout";

export default function NotFound() {
  return (
    <Layout title="Page not found" description="This page doesn't exist." noindex>
      <section className="section">
        <div className="wrap" style={{ textAlign: "center", maxWidth: 560 }}>
          <img src="/meldling-256.png" alt="" width={120} height={120} style={{ margin: "0 auto 24px", borderRadius: 28 }} />
          <h1 style={{ fontSize: "2.2rem" }}>This page wandered off</h1>
          <p className="muted">The address may be mistyped, or the page has moved.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link href="/" className="btn btn-primary">
              Go home
            </Link>
            <Link href="/support" className="btn btn-secondary">
              Get help
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
