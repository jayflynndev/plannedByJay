import "server-only";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList(); globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16]] as const) blocked.addSubnet(address, prefix, "ipv6");
export function publicAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}
export function lookupUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
      !url.hostname.includes(".") || isIP(url.hostname.replace(/^\[|\]$/g, "")) || /\.(?:local|localhost|internal|test|invalid)$/i.test(url.hostname))
    throw new Error("Lookup needs a public HTTPS supplier website.");
  url.hash = "";
  return url;
}
// One page only, no scripts, cookies, redirects or link-following. Pin checked DNS results
// into the HTTPS connection so a later DNS answer cannot redirect a request internally.
export async function readPublicPage(value: string): Promise<{html: string; url: string}> {
  const url = lookupUrl(value);
  const signal = AbortSignal.timeout(8000);
  const answers = await new Promise<Awaited<ReturnType<typeof lookup>>[]>((resolve, reject) => {
    const onAbort = () => reject(new Error("Supplier lookup timed out."));
    signal.addEventListener("abort", onAbort, {once: true});
    lookup(url.hostname, {all: true, verbatim: true}).then(rows => {
      signal.removeEventListener("abort", onAbort); resolve(rows);
    }, error => {signal.removeEventListener("abort", onAbort); reject(error);});
  });
  if (!answers.length || answers.some(a => !publicAddress(a.address))) throw new Error("That website cannot be used for lookup.");
  const pinned = answers[0];
  return new Promise((resolve, reject) => {
    const req = request(url, {
      method: "GET", agent: false, signal,
      lookup: (_host, options, callback) => {
        if (options.all) callback(null, [pinned]); else callback(null, pinned.address, pinned.family);
      },
      headers: {Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "identity", "User-Agent": "PlannedByJay-SupplierDetails/1.0"},
    }, response => {
      if (response.statusCode !== 200 || !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(response.headers["content-type"] || "")) {
        response.destroy(); reject(new Error("The website did not provide an accessible HTML page. You can complete the details manually.")); return;
      }
      const chunks: Buffer[] = []; let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 2_000_000) {req.destroy(new Error("The supplier page is too large for this small lookup.")); return;}
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve({html: Buffer.concat(chunks).toString("utf8"), url: url.href}));
    });
    req.on("error", reject); req.end();
  });
}
