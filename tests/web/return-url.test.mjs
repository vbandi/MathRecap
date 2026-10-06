import assert from "node:assert/strict";
import test from "node:test";
import { localReturnUrl } from "../../web/return-url.mjs";

test("local paths are kept with their query and fragment", () => {
  assert.equal(localReturnUrl("/"), "/");
  assert.equal(localReturnUrl("/worksheet.html?skill=ALG-08"), "/worksheet.html?skill=ALG-08");
  assert.equal(localReturnUrl("/review.html#ALG-08"), "/review.html#ALG-08");
  assert.equal(localReturnUrl("/a/../index.html"), "/index.html");
});

test("anything that could leave the site falls back to the tree", () => {
  for (const value of [
    null,
    undefined,
    "",
    "index.html",
    "https://attacker.example/",
    "//attacker.example/",
    "/\\attacker.example/",
    "/\t/attacker.example/",
    "\\\\attacker.example",
    "javascript:alert(1)",
    " /index.html",
  ]) {
    assert.equal(localReturnUrl(value), "/", String(value));
  }
});
