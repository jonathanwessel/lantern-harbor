// Build a tagged release into live/, which `npm run play` serves on port 5173.
// Usage: npm run release            -> tags v<package.json version> at HEAD (tree must be clean) and builds it
//        npm run release -- v0.2.0  -> rebuilds an existing tag
// Only committed, tagged code ever reaches the play server, so work in progress can't break a running game.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const sh = cmd => execSync(cmd, { cwd: root, encoding: "utf8" }).trim();

let tag = process.argv[2];
if (!tag) {
  if (sh("git status --porcelain")) { console.error("Working tree has uncommitted changes. Commit first."); process.exit(1); }
  tag = "v" + JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const exists = sh(`git tag --list ${tag}`);
  if (exists && sh(`git rev-list -n1 ${tag}`) !== sh("git rev-parse HEAD")) { console.error(`${tag} already exists on another commit. Bump the version.`); process.exit(1); }
  if (!exists) sh(`git tag -a ${tag} -m "Lantern Harbor ${tag}"`);
}

const src = join(tmpdir(), `lh-release-${tag}-${Date.now()}`);
sh(`git worktree add --detach "${src}" ${tag}`);
try {
  const cfg = join(src, "vite.config.js");
  await build({ root: src, configFile: existsSync(cfg) ? cfg : false, logLevel: "warn",
    build: { outDir: join(root, "live"), emptyOutDir: true } });
  console.log(`Released ${tag} -> live/  (refresh the game at http://localhost:5173 to get it)`);
} finally {
  sh(`git worktree remove --force "${src}"`);
}
