import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const origin = "https://meldiq.app";
const keyFiles = readdirSync("public").filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (keyFiles.length !== 1) throw new Error("Expected one IndexNow key file in public/");
const keyFile = keyFiles[0];
const key = readFileSync(join("public", keyFile), "utf8").trim();
if (keyFile !== `${key}.txt`) throw new Error("IndexNow key does not match its file name");

const keyLocation = origin + "/" + keyFile;
const urlList = [...new Set(process.argv.slice(2))].map((path) => new URL(path, origin).href);
if (!urlList.length || urlList.length > 100) throw new Error("Specify 1 to 100 changed canonical URLs or paths.");

const get = (url) => fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
const [keyResponse, sitemap] = await Promise.all([get(keyLocation), get(origin + "/sitemap.xml")]);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) throw new Error("IndexNow key is not available on the live site");
if (!sitemap.ok) throw new Error("The live sitemap is unavailable");
const sitemapUrls = new Set([...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url));
for (const url of urlList) {
  if (new URL(url).origin !== origin || !sitemapUrls.has(url)) {
    throw new Error(`URL is outside the live canonical sitemap: ${url}`);
  }
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`IndexNow rejected the request with HTTP ${response.status}`);
console.log(`IndexNow HTTP ${response.status} for ${urlList.length} URLs. This is a submission receipt.`);
