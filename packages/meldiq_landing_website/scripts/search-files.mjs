import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const out = resolve("out");
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const origin = new URL(canonical(readFileSync(join(out, "index.html"), "utf8"))).origin;
const urls = [];

for (const file of readdirSync(out, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith(".html")) continue;
  const fullPath = join(file.parentPath, file.name);
  const page = readFileSync(fullPath, "utf8");
  if (/<meta name="robots" content="[^"]*\bnoindex\b/.test(page)) continue;

  const path = "/" + relative(out, fullPath).replace(/\.html$/, "").replace(/^index$/, "");
  const expected = new URL(path, origin).href;
  if (canonical(page) !== expected) {
    throw new Error(`Expected canonical ${expected} in ${path}`);
  }
  urls.push(expected);
}

const xmlEscape = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[character]);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.sort().map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");
writeFileSync(join(out, "sitemap.xml"), sitemap);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nDisallow: /v2/\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Search sitemap includes ${urls.length} canonical pages.`);
