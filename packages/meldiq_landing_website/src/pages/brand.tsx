import { GuidePage } from "../components/GuidePage";

export default function Brand() {
  return (
    <GuidePage
      title="Brand kit"
      eyebrow="SAY HELLO TO MELDIQ"
      heading="A familiar face for your space."
      description="The Meldiq name, wordmark and Meldling companion help people recognize the app and its communities."
      sections={[
        {
          title: "The name",
          text: "Write Meldiq with a capital M in prose. Our lowercase wordmark includes a dot. Keep enough space around the mark so it remains easy to recognize.",
        },
        {
          title: "Meet Meldling",
          text: "Meldling is Meldiq’s community companion. Use the original artwork without stretching, recoloring or adding elements that make it hard to recognize.",
        },
        {
          title: "Keep the context clear",
          text: "When describing a community or integration, clearly identify who operates it. Using a brand asset does not imply endorsement, partnership or official status. Meldiq’s brand assets remain the property of their owner.",
          href: "/support",
          label: "Ask about brand usage",
        },
      ]}
    >
      <section className="brand-assets wrap" aria-label="Brand assets">
        <article className="brand-asset wordmark-asset">
          <span className="brand-asset-label">WORDMARK</span>
          <div className="brand-lockup">
            <img src="/meldling-128.png" width={60} height={60} alt="" />
            <strong>
              meldiq<span>.</span>
            </strong>
          </div>
          <p>Meldiq · Community messaging</p>
        </article>
        <article className="brand-asset">
          <span className="brand-asset-label">MELDLING</span>
          <img className="brand-mascot" src="/meldling-512.png" width={160} height={160} alt="Meldling, the Meldiq community companion" />
          <a className="inline-link" href="/meldling-512.png" download="meldiq-meldling.png">
            Download PNG ↓
          </a>
        </article>
      </section>
    </GuidePage>
  );
}
