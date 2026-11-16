// Read-only verification. Run on the target VPS after import, with an independently
// downloaded copy of the originals under SOURCE_MEDIA_DIR. Never deletes anything.
import postgres from "postgres";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  compareRecords,
  legacyReferences,
  retirementAllowed,
  verifiedFile,
  type RecordRow,
} from "./verification-lib";

const env = process.env;
const reportPath =
  process.argv.find((a) => a.startsWith("--report="))?.slice(9) || "migration-verification.json";
const required = [
  "SOURCE_DATABASE_URL",
  "DATABASE_URL",
  "SOURCE_MEDIA_DIR",
  "MEDIA_DIR",
  "VERIFICATION_HAR",
];
const missing = required.filter((k) => !env[k]);
const report: Record<string, unknown> = {
  checkedAt: new Date().toISOString(),
  readOnly: true,
  retirementAllowed: false,
  database: { status: "BLOCKED" },
  media: { status: "BLOCKED" },
  urls: { status: "BLOCKED" },
  blockers: missing.map((k) => `Missing ${k}`),
};

async function codeReferences(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    // Editor-generated integration is retained but disconnected from the app graph.
    if (path.endsWith("integrations/supabase")) continue;
    if (entry.isDirectory()) found.push(...(await codeReferences(path)));
    else if (/\.(?:tsx?|jsx?|json|html)$/.test(path)) {
      const text = await readFile(path, "utf8");
      if (
        legacyReferences(text).length ||
        /(?:from|import\s*\()\s*["'][^"']*(?:integrations\/supabase|supabase-js)|\b(?:VITE_)?SUPABASE_[A-Z_]+/.test(
          text,
        )
      )
        found.push(path);
    }
  }
  return found;
}

async function verify() {
  const code = [...(await codeReferences("src")), ...(await codeReferences("public"))];
  report["codeReferences"] = code;
  if (missing.length) return;
  const sourceUrl = env["SOURCE_DATABASE_URL"],
    targetUrl = env["DATABASE_URL"];
  if (!sourceUrl || !targetUrl) return;
  if (sourceUrl === targetUrl) throw new Error("Source and target must be different databases");
  const source = postgres(sourceUrl, { max: 1, onnotice: () => {} });
  const target = postgres(targetUrl, { max: 1, onnotice: () => {} });
  try {
    await source.begin("isolation level repeatable read read only", async (src) => {
      await target.begin("isolation level repeatable read read only", async (dst) => {
        const [version] = await dst`select current_setting('server_version_num') as version`;
        const tables: Record<string, unknown> = {};
        const issues: { table: string; id: string; rule: string }[] = [];
        const urlIssues: { table: string; id: string; paths: string[] }[] = [];
        const accounts = await src<RecordRow[]>`select id::text, created_at from auth.users`;
        const targetAccounts = await dst<
          RecordRow[]
        >`select id::text, created_at from public.accounts`;
        tables["accounts"] = compareRecords(accounts, targetAccounts);
        const targetIds = new Set(targetAccounts.map((r) => r.id));
        const pairs = [
          ["users", "profiles"],
          ["products", "products"],
          ["services", "services"],
          ["posts", "posts"],
          ["conversations", "conversations"],
          ["notifications", "notifications"],
        ];
        const owners: Record<string, string> = {
          products: "sellerId",
          services: "providerId",
          posts: "authorId",
        };
        for (const [oldTable, newTable] of pairs) {
          if (!oldTable || !newTable) continue;
          const before = await src<
            RecordRow[]
          >`select id::text,data,created_at from public.${src(oldTable)}`;
          const after = await dst<RecordRow[]>`select * from public.${dst(newTable)}`;
          tables[oldTable] = compareRecords(before, after);
          const mapped = new Map(after.map((r) => [r.id, r]));
          for (const row of before) {
            const data = row["data"] as Record<string, unknown>;
            const to = mapped.get(row.id);
            const key = owners[oldTable];
            if (key) {
              const owner = String(data[key] ?? "");
              if (!targetIds.has(owner) || to?.["owner_id"] !== owner)
                issues.push({
                  table: oldTable,
                  id: row.id,
                  rule: "Owner relationship missing or changed",
                });
            }
            if (oldTable === "users" && !targetIds.has(row.id))
              issues.push({ table: oldTable, id: row.id, rule: "Profile account missing" });
            if (oldTable === "notifications") {
              for (const [jsonKey, column] of [
                ["recipientId", "recipient_id"],
                ["actorId", "actor_id"],
              ]) {
                if (!jsonKey || !column) continue;
                const id = String(data[jsonKey] ?? "");
                if (!targetIds.has(id) || to?.[column] !== id)
                  issues.push({
                    table: oldTable,
                    id: row.id,
                    rule: `${jsonKey} relationship missing or changed`,
                  });
              }
            }
            if (oldTable === "conversations") {
              const expected = Array.isArray(data["participantIds"])
                ? [...new Set(data["participantIds"].map(String))].sort()
                : [];
              const actual =
                await dst`select user_id::text from public.conversation_participants where conversation_id=${row.id}`;
              if (
                JSON.stringify(expected) !==
                JSON.stringify(actual.map((r) => String(r["user_id"])).sort())
              )
                issues.push({
                  table: oldTable,
                  id: row.id,
                  rule: "Participant relationships missing or changed",
                });
              const oldMessages = data["messages"];
              const newMessages = (to?.["data"] as Record<string, unknown> | undefined)?.[
                "messages"
              ];
              if (
                (Array.isArray(oldMessages) ? oldMessages.length : 0) !==
                (Array.isArray(newMessages) ? newMessages.length : 0)
              )
                issues.push({ table: oldTable, id: row.id, rule: "Message count changed" });
            }
          }
          for (const row of after) {
            const paths = legacyReferences(row["data"]);
            if (paths.length) urlIssues.push({ table: newTable, id: row.id, paths });
          }
        }
        const databasePassed =
          Number(version?.["version"]) >= 180000 &&
          Number(version?.["version"]) < 190000 &&
          Object.values(tables).every((t) => (t as { passed: boolean }).passed) &&
          !issues.length;
        report["database"] = {
          status: databasePassed ? "PASS" : "FAIL",
          postgresVersion: Number(version?.["version"]),
          tables,
          relationships: issues,
        };

        const objects =
          await src`select name,metadata from storage.objects where bucket_id='agroconnect-media' order by name`;
        const files =
          await dst`select id::text,legacy_path,storage_key,size_bytes,sha256,deleted_at from public.media_files where legacy_path is not null`;
        const originalsRoot = env["SOURCE_MEDIA_DIR"],
          localRoot = env["MEDIA_DIR"];
        if (!originalsRoot || !localRoot) return;
        const mediaIssues: { path: string; reason: string }[] = [];
        let verified = 0;
        for (const object of objects) {
          const name = String(object["name"]);
          try {
            const row = files.find((r) => r["legacy_path"] === name);
            if (!row || row["deleted_at"]) throw new Error("Local media record missing or deleted");
            const original = await verifiedFile(originalsRoot, name);
            const local = await verifiedFile(localRoot, String(row["storage_key"]));
            const metadata = object["metadata"] as { size?: number } | null;
            if (metadata?.size == null || Number(metadata.size) !== original.size)
              throw new Error("Source file size does not match original storage metadata");
            if (
              original.sha256 !== local.sha256 ||
              local.sha256 !== row["sha256"] ||
              local.size !== Number(row["size_bytes"])
            )
              throw new Error("Original/local/database SHA-256 or size mismatch");
            verified++;
          } catch (e) {
            mediaIssues.push({ path: name, reason: (e as Error).message });
          }
        }
        // The actual mounted VPS directory must be checked, not a disposable test folder.
        const expectedRoot = resolve(localRoot) === "/app/data/media";
        const mediaPassed =
          expectedRoot &&
          verified === objects.length &&
          !mediaIssues.length &&
          files.length === objects.length;
        report["media"] = {
          status: mediaPassed ? "PASS" : "FAIL",
          root: resolve(localRoot),
          expectedRoot,
          source: objects.length,
          target: files.length,
          verified,
          issues: mediaIssues,
        };

        const harPath = env["VERIFICATION_HAR"];
        if (!harPath) return;
        const har = JSON.parse(await readFile(harPath, "utf8"));
        const entries = har?.log?.entries;
        const requests = Array.isArray(entries) ? entries : [];
        // A sanitized HAR must cover signed-in read-back flows and media responses.
        const trafficIssues = requests.flatMap(
          (
            r: {
              request?: { url?: string };
              response?: { status?: number; content?: { text?: string; encoding?: string } };
            },
            i: number,
          ) => {
            let body = r.response?.content?.text ?? "";
            if (r.response?.content?.encoding === "base64")
              body = Buffer.from(body, "base64").toString("utf8");
            return legacyReferences([r.request?.url, body]).length ? [i] : [];
          },
        );
        const successfulMedia = requests.some(
          (r: { request?: { url?: string }; response?: { status?: number } }) =>
            /\/api\/media\//.test(r.request?.url ?? "") &&
            [200, 206].includes(r.response?.status ?? 0),
        );
        // Human evidence is required; a handful of clean demo requests cannot prove full coverage.
        const coverage = har["verificationCoverage"];
        const flows = [
          "signedIn",
          "profiles",
          "products",
          "services",
          "posts",
          "conversations",
          "notifications",
          "allMigratedMedia",
        ];
        const covered = flows.every((f) => coverage?.[f] === true);
        const urlsPassed =
          !code.length &&
          !urlIssues.length &&
          !trafficIssues.length &&
          requests.length > 0 &&
          successfulMedia &&
          covered &&
          mediaPassed;
        report["urls"] = {
          status: urlsPassed ? "PASS" : "FAIL",
          codeReferences: code,
          storedReferences: urlIssues,
          legacyRequestOrResponseIndexes: trafficIssues,
          requestCount: requests.length,
          successfulMedia,
          covered,
        };
        report["retirementAllowed"] = retirementAllowed(
          databasePassed,
          mediaPassed,
          urlsPassed && !trafficIssues.length,
        );
      });
    });
  } finally {
    await source.end();
    await target.end();
  }
}

verify()
  .catch((e) => {
    // Do not print connection strings, URLs containing tokens, or database errors.
    report["blockers"] = [
      ...(report["blockers"] as string[]),
      `Verification interrupted (${e instanceof Error ? e.name : "error"}); investigate locally without exposing credentials`,
    ];
  })
  .finally(async () => {
    await writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(
      `Verification report: ${reportPath}; retirement ${report["retirementAllowed"] ? "ALLOWED" : "BLOCKED"}`,
    );
    process.exitCode = report["retirementAllowed"] ? 0 : 2;
  });
