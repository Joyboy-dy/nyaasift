// Project check: environment files and secrets.
// Written by Groundwork, owned by this project. Run: bun scripts/check-env.ts [--json]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

type Issue = { level: "error" | "warning"; code: string; message: string; path?: string };

const SECRET_PATTERNS: [string, RegExp][] = [
  ["clé privée", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["clé AWS", /AKIA[0-9A-Z]{16}/],
  ["jeton GitHub", /ghp_[A-Za-z0-9]{36}/],
  ["jeton GitHub", /github_pat_[A-Za-z0-9_]{60,}/],
  ["clé Stripe", /sk_live_[A-Za-z0-9]{16,}/],
  ["jeton Slack", /xox[baprs]-[A-Za-z0-9-]{10,}/],
];
const SKIPPED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".next",
  "build",
  "coverage",
]);
const MAX_SIZE = 1024 * 1024;

const issues: Issue[] = [];

/** `.env`, `.env.local`, `.env.prod`… at any depth: real values, never committed. */
function isRealEnvFile(path: string): boolean {
  const name = path.split("/").pop() ?? "";
  return name === ".env" || (name.startsWith(".env.") && !name.endsWith(".example"));
}

if (!existsSync(".env.example"))
  issues.push({
    level: "error",
    code: "env_example_missing",
    path: ".env.example",
    message: ".env.example est absent.",
  });

const ignored = existsSync(".gitignore")
  ? readFileSync(".gitignore", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
  : [];
if (!ignored.includes(".env.*") || !ignored.includes("!.env.example"))
  issues.push({
    level: "error",
    code: "env_not_ignored",
    path: ".gitignore",
    message: ".gitignore doit ignorer .env.* tout en gardant .env.example (!.env.example).",
  });

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const path = dir === "." ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path, out);
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

// In a git repository, only tracked files matter; a repository git cannot read is scanned in full.
let files: string[] | null = null;
if (existsSync(".git")) {
  const listed = Bun.spawnSync(["git", "ls-files", "-z"]);
  if (listed.exitCode === 0) files = listed.stdout.toString().split("\0").filter(Boolean);
  else
    issues.push({
      level: "warning",
      code: "git_unreadable",
      message:
        "git ne peut pas lister les fichiers suivis (dépôt illisible ou « dubious ownership ») : tous les fichiers sont analysés.",
    });
}
const tracked = files !== null;
files ??= walk(".");

if (tracked)
  for (const file of files.filter(isRealEnvFile))
    issues.push({
      level: "error",
      code: "env_file_tracked",
      path: file,
      message: `${file} contient de vraies valeurs et ne doit pas être suivi par git (git rm --cached ${file}).`,
    });

// Real environment files are where secrets belong: they are never scanned.
for (const file of files.filter((f) => !isRealEnvFile(f))) {
  if (!existsSync(file) || !statSync(file).isFile() || statSync(file).size > MAX_SIZE) continue;
  const bytes = readFileSync(file);
  if (bytes.includes(0)) continue;
  bytes
    .toString("utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const found = SECRET_PATTERNS.find(([, pattern]) => pattern.test(line));
      if (found)
        issues.push({
          level: "error",
          code: "secret_suspected",
          path: file,
          message: `${file}, ligne ${index + 1} : ressemble à un secret (${found[0]}). Le retirer et le révoquer.`,
        });
    });
}

if (process.argv.includes("--json")) console.log(JSON.stringify({ issues }));
else if (issues.length === 0) console.log("Environnement et secrets : OK");
else
  for (const issue of issues)
    console.log(`${issue.level === "error" ? "✗" : "!"} ${issue.message}`);
process.exit(issues.some((issue) => issue.level === "error") ? 1 : 0);
