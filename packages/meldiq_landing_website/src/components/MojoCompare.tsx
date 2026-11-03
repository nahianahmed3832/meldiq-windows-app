import type { MojoCatalog, PlanPerks, SparkLevel } from "../lib/api";
import { formatMoney } from "../lib/money";

/**
 * Mojo Plus's perks and Meldiq Spark, from the API's Mojo catalog (GET /v2/mojo/catalog). The marketing preview applies the approved Plus upload limit; other values come from the catalog.
 */

/** Decimal units, as the catalog counts them: 1 MB = 1,000,000 bytes, 1,024 MB = 1,000,000,000. */
export function decimalBytes(n: number): string {
  if (n === 1_024_000_000) return "1,024 MB";
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)} GB`;
  return `${Math.round(n / 1_000_000)} MB`;
}

const count = (n: number) => n.toLocaleString("en-US");

function bestScreen(mojo: MojoCatalog, ids: readonly string[]): string {
  const labels = new Map(mojo.screenPresets.map((p) => [p.id, p.label]));
  return ids.map((id) => labels.get(id) ?? id).join(" or ");
}

/** A plan's perks in plain words (its card on the home page). */
export function perkLines(mojo: MojoCatalog, p: PlanPerks): string[] {
  return [
    `${count(p.messageChars)} characters per message`,
    `Files up to ${decimalBytes(p.uploadBytes)}`,
    `Screen sharing at ${bestScreen(mojo, p.screen)}`,
    ...(p.sparks > 0 ? [`${p.sparks} Meldiq Spark${p.sparks === 1 ? "" : "s"} included`] : []),
    `${count(p.customItems)} custom emoji and stickers`,
    ...(p.bots !== undefined ? [`${count(p.bots)} bots you can make`] : []),
    ...(p.badge ? [p.check ? `${p.name.replace("Mojo ", "")} badge and Meldiq Check` : `${p.name.replace("Mojo ", "")} badge`] : []),
  ];
}

const ROWS: { label: string; cell: (m: MojoCatalog, p: PlanPerks) => string }[] = [
  { label: "Characters in one message", cell: (_m, p) => count(p.messageChars) },
  { label: "Largest file you can share", cell: (_m, p) => decimalBytes(p.uploadBytes) },
  { label: "Screen sharing", cell: (m, p) => bestScreen(m, p.screen) },
  { label: "Meldiq Sparks included", cell: (_m, p) => (p.sparks === 0 ? "None" : count(p.sparks)) },
  { label: "Custom emoji and stickers you can add", cell: (_m, p) => count(p.customItems) },
  { label: "Bots you can make", cell: (_m, p) => (p.bots === undefined ? "Not published" : count(p.bots)) },
  { label: "Name badge", cell: (_m, p) => (p.badge ? (p.check ? "Plus badge and Meldiq Check" : `${p.name} badge`) : "None") },
];

export function CompareTable({ mojo }: { mojo: MojoCatalog }) {
  return (
    <div className="table-scroll" role="region" aria-label="Plan comparison, horizontally scrollable" tabIndex={0}>
      <table className="compare">
        <caption>{mojo.enforced === true ? "Current account entitlements" : "Free and Mojo Plus — updated plan preview, not active yet"}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Perk</span>
            </th>
            {mojo.plans.map((p) => (
              <th key={p.key} scope="col">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              {mojo.plans.map((p) => (
                <td key={p.key}>{r.cell(mojo, p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function levelPerks(mojo: MojoCatalog, l: SparkLevel): string[] {
  return [
    `${count(l.emojiSlots)} emoji slots`,
    ...(l.stickerSlots !== undefined ? [`${count(l.stickerSlots)} sticker slots`] : []),
    ...(l.uploadBytes ? [`Files up to ${decimalBytes(l.uploadBytes)} for everyone`] : []),
    `${l.voiceKbps} kbps voice`,
    ...(l.screen.length ? [`Screen sharing at ${bestScreen(mojo, l.screen)} for everyone`] : []),
  ];
}

/** Meldiq Spark: what levels a community reaches, and what everyone in it gets. */
export function SparkLevels({ mojo }: { mojo: MojoCatalog }) {
  const levels = mojo.spark.levels.filter((l) => l.level > 0);
  const price = mojo.onSale?.spark;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="spark-levels">
        {levels.map((l) => (
          <div key={l.level} className="spark-level">
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <span className="spark-badge" aria-hidden="true">
                ✦{l.level}
              </span>
              <h3 style={{ margin: 0 }}>Level {l.level}</h3>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {count(l.sparks)} Sparks
            </p>
            <ul className="checklist">
              {levelPerks(mojo, l).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Spark is separate community boosting. Mojo Plus {mojo.enforced === true ? "includes" : "is configured to include"}{" "}
        {mojo.plans.find((p) => p.key === "plus")?.sparks ?? 0} Sparks.{" "}
        {price
          ? `Extra Sparks are ${formatMoney(price.amountMinor, price.currency)} each${sparkPaymentTerms(mojo.spark.interval)}, on any plan.`
          : "Extra Sparks can be added on any plan once they're on sale."}{" "}
        Assign, move or remove Sparks in Meldiq. Review the purchase and expiration terms in the app before paying. Benefits never lower anyone&apos;s own plan.
      </p>
    </div>
  );
}

/** Follow the published Spark billing interval; never describe a one-time purchase as a subscription. */
export function sparkPaymentTerms(interval: string): string {
  if (interval === "one_time") return " as a one-time purchase";
  if (interval === "month") return " per month";
  if (interval === "year") return " per year";
  return "; check payment terms in the app";
}
