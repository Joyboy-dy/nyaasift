// Project check: documentation for humans and agents.
// Written by Groundwork, owned by this project. Run: bun scripts/check-docs.ts [--json]
import { existsSync, readFileSync } from "node:fs";

type Issue = { level: "error" | "warning"; code: string; message: string; path?: string };

const issues: Issue[] = [];
const lineCount = (path: string) =>
  readFileSync(path, "utf8")
    .replace(/\r?\n$/, "")
    .split(/\r?\n/).length;

if (!existsSync("AGENTS.md")) {
  issues.push({
    level: "error",
    code: "agents_md_missing",
    path: "AGENTS.md",
    message: "AGENTS.md est absent.",
  });
} else {
  const lines = lineCount("AGENTS.md");
  if (lines > 200)
    issues.push({
      level: "error",
      code: "agents_md_long",
      path: "AGENTS.md",
      message: `AGENTS.md fait ${lines} lignes (200 au plus) : condenser et déplacer les détails dans .agents/.`,
    });
  else if (lines < 120)
    issues.push({
      level: "warning",
      code: "agents_md_short",
      path: "AGENTS.md",
      message: `AGENTS.md fait ${lines} lignes (cible : 120 à 150).`,
    });
}

if (!existsSync("CLAUDE.md") || !readFileSync("CLAUDE.md", "utf8").includes("@AGENTS.md"))
  issues.push({
    level: "error",
    code: "claude_md_import_missing",
    path: "CLAUDE.md",
    message: "CLAUDE.md doit importer AGENTS.md (ligne « @AGENTS.md »).",
  });

if (!existsSync("README.md")) {
  issues.push({
    level: "error",
    code: "readme_missing",
    path: "README.md",
    message: "README.md est absent.",
  });
} else {
  const lines = lineCount("README.md");
  if (lines > 150)
    issues.push({
      level: "error",
      code: "readme_long",
      path: "README.md",
      message: `README.md fait ${lines} lignes (150 au plus) : déplacer les détails dans docs/.`,
    });
}

if (process.argv.includes("--json")) console.log(JSON.stringify({ issues }));
else if (issues.length === 0) console.log("Documentation : OK");
else
  for (const issue of issues)
    console.log(`${issue.level === "error" ? "✗" : "!"} ${issue.message}`);
process.exit(issues.some((issue) => issue.level === "error") ? 1 : 0);
