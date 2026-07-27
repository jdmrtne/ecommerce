#!/usr/bin/env node
/**
 * Syncs `index.html`'s static `<title>`, description, theme-color, and
 * favicon tags with `src/config/brandingMeta.ts` (Phase 13). These tags
 * render before React mounts, so non-JS crawlers and pre-hydration
 * social-share scrapers see them as-is - `useSiteMeta` (see
 * `src/hooks/useSiteMeta.ts`) only patches the live DOM after mount, so
 * it can't cover that gap on its own.
 *
 * Runs as the first step of `npm run build` (see package.json). Imports
 * `brandingMeta.ts` and `titleTemplate.ts` directly by relative path -
 * both are deliberately asset-free and alias-free plain TypeScript
 * modules (no `@/` import, no image import) specifically so a plain
 * Node process can load them without going through Vite. This requires
 * Node 22.6+ (native TypeScript type-stripping, no flag needed as of
 * Node 22.18/23.6) - already implied by this project's toolchain
 * (Vite 8, React 19).
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { BRANDING_META } from "../src/config/brandingMeta.ts";
import { buildTitle } from "../src/config/titleTemplate.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, "../index.html");

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function replaceOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`sync-index-html: could not find ${label} tag in index.html - has its markup changed?`);
  }
  return html.replace(pattern, replacement);
}

async function run() {
  let html = await readFile(indexPath, "utf8");

  const title = buildTitle(BRANDING_META.businessName, BRANDING_META.tagline, "");
  const description = BRANDING_META.businessDescription;

  html = replaceOrThrow(html, /<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`, "<title>");
  html = replaceOrThrow(
    html,
    /<meta name="description" content=".*?" \/>/s,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    'meta[name="description"]',
  );
  html = replaceOrThrow(
    html,
    /<meta name="theme-color" content=".*?" \/>/s,
    `<meta name="theme-color" content="${escapeHtml(BRANDING_META.themeColor)}" />`,
    'meta[name="theme-color"]',
  );
  html = replaceOrThrow(
    html,
    /<link rel="icon" type="image\/png" href=".*?" \/>/s,
    `<link rel="icon" type="image/png" href="${escapeHtml(BRANDING_META.favicon)}" />`,
    'link[rel="icon"]',
  );

  await writeFile(indexPath, html, "utf8");
  console.log(`sync-index-html: synced index.html from brandingMeta.ts (title: "${title}").`);
}

run().catch((err) => {
  console.error("sync-index-html failed:", err.message);
  process.exit(1);
});
