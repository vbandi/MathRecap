import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// The server's Content-Security-Policy (SecurityHeaders.cs) allows scripts and styles from the app's own
// files only. These checks catch what the policy would block in the browser: inline scripts and styles,
// event handler attributes, style attributes in HTML (or set with setAttribute), and eval.

const webRoot = fileURLToPath(new URL("../../web/", import.meta.url));

function filesOf(directory, extensions) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.includes(extname(entry.name)))
    .map((entry) => join(entry.parentPath, entry.name));
}

function violations(files, rules) {
  const found = [];
  for (const file of files) {
    readFileSync(file, "utf8").split("\n").forEach((line, index) => {
      for (const [name, pattern] of rules) {
        if (pattern.test(line)) found.push(`${relative(webRoot, file)}:${index + 1} ${name}: ${line.trim()}`);
      }
    });
  }
  return found;
}

test("pages have no inline scripts, inline styles or event handler attributes", () => {
  const pages = filesOf(webRoot, [".html"]);
  assert.ok(pages.length >= 7);
  assert.deepEqual(violations(pages, [
    ["inline script", /<script(?![^>]*\bsrc=)[^>]*>/i],
    ["style element", /<style[\s>]/i],
    ["style attribute", /\sstyle\s*=/i],
    ["event handler attribute", /<[^>]+\son[a-z]+\s*=/i],
    ["javascript: URL", /javascript:/i],
  ]), []);
});

test("scripts set styles through the CSSOM and never evaluate strings", () => {
  const scripts = filesOf(webRoot, [".js", ".mjs"]);
  assert.ok(scripts.length > 100);
  assert.deepEqual(violations(scripts, [
    ["style attribute in HTML text", /<[a-zA-Z][^<>]*\sstyle\s*=/],
    ["style element", /<style[\s>]|createElement(NS)?\([^)]*["'`]style["'`]/],
    ["style set with setAttribute", /setAttribute(NS)?\([^)]*["'`]style["'`]/],
    ["event handler attribute", /<[a-zA-Z][^<>]*\son[a-z]+\s*=|setAttribute\(\s*["'`]on[a-z]+["'`]/],
    ["string evaluation", /\beval\(|new Function\(|set(Timeout|Interval)\(\s*["'`]/],
    ["javascript: URL", /javascript:/i],
  ]), []);
});
