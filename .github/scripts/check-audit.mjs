// Normalizes bun/npm audit JSON, prints a readable table + step summary,
// and fails the job only on CRITICAL advisories.
import fs from "node:fs";

const file = "audit-report.json";
const source = process.env.AUDIT_SOURCE || "unknown";
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
const out = [];
const log = (line = "") => { console.log(line); out.push(line); };

if (source === "none" || !fs.existsSync(file) || !fs.statSync(file).size) {
  console.log("::error::No audit data was produced. See audit-error.log in the workflow artifact.");
  process.exit(2);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (err) {
  console.log(`::error::audit-report.json is not valid JSON (${err.message}).`);
  process.exit(2);
}

if (!data?.vulnerabilities || !data?.metadata) {
  console.log(`::error::The audit service returned an error instead of an advisory report: ${data?.message ?? "unknown response"}`);
  process.exit(2);
}

/** @returns {{name:string,severity:string,title:string,url:string}[]} */
function normalize(d) {
  // npm v7+ shape: { vulnerabilities: { pkg: { severity, via: [...] } } }
  if (d && d.vulnerabilities && !Array.isArray(d.vulnerabilities)) {
    return Object.entries(d.vulnerabilities).flatMap(([name, v]) => {
      const vias = Array.isArray(v.via) ? v.via.filter((x) => typeof x === "object") : [];
      if (!vias.length) return [{ name, severity: v.severity ?? "unknown", title: "transitive advisory", url: "" }];
      return vias.map((x) => ({
        name: x.name ?? name,
        severity: (x.severity ?? v.severity ?? "unknown"),
        title: x.title ?? "",
        url: x.url ?? "",
      }));
    });
  }
  // bun shape: { advisories: { pkg: [ { severity, title, url } ] } } or array
  const raw = d?.advisories ?? d;
  const list = Array.isArray(raw) ? raw : Object.entries(raw ?? {}).flatMap(([name, v]) =>
    (Array.isArray(v) ? v : [v]).map((a) => ({ ...a, name: a?.module_name ?? a?.name ?? name })),
  );
  return list.filter(Boolean).map((a) => ({
    name: a.name ?? a.module_name ?? "package",
    severity: String(a.severity ?? "unknown").toLowerCase(),
    title: a.title ?? "",
    url: a.url ?? a.advisory ?? "",
  }));
}

const all = normalize(data).map((a) => ({ ...a, severity: String(a.severity).toLowerCase() }));
const order = ["critical", "high", "moderate", "low", "info", "unknown"];
const counts = Object.fromEntries(order.map((s) => [s, all.filter((a) => a.severity === s).length]));
const critical = all.filter((a) => a.severity === "critical");

log(`### Dependency audit (source: \`${source}\`)`);
log("");
log("| Severity | Count |");
log("|---|---|");
for (const s of order) if (counts[s]) log(`| ${s} | ${counts[s]} |`);
if (!all.length) log("| none | 0 |");
log("");

if (all.length) {
  log("<details><summary>All advisories</summary>");
  log("");
  log("| Package | Severity | Advisory |");
  log("|---|---|---|");
  for (const a of all.slice(0, 200)) {
    log(`| \`${a.name}\` | ${a.severity} | ${(a.title || a.url || "").replace(/\|/g, "\\|")} |`);
  }
  log("");
  log("</details>");
}

for (const a of critical) {
  console.log(`::error::CRITICAL ${a.name} — ${a.title || a.url}`);
}

if (summaryFile) fs.appendFileSync(summaryFile, out.join("\n") + "\n");

if (critical.length) {
  console.log(`\nFailing: ${critical.length} critical advisory(ies). Full logs are in the "dependency-audit" artifact.`);
  process.exit(1);
}
console.log(`No critical advisories (${all.length} total).`);
