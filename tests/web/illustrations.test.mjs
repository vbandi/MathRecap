import assert from "node:assert/strict";
import test from "node:test";
import { findSkill } from "../../web/curriculum.mjs";
import { illustrations, hasIllustration } from "../../web/illustrations/registry.js";
import { formatNumber, gcd, withInstrumental } from "../../web/illustrations/kit.js";
import { formula } from "../../web/illustrations/fug-10.js";

test("every illustration belongs to an existing skill and exports mount", async () => {
  for (const [skillId, load] of Object.entries(illustrations)) {
    assert.ok(findSkill(skillId), `${skillId} is not a skill in the curriculum`);
    const module = await load();
    assert.equal(typeof module.mount, "function", `${skillId} does not export mount()`);
  }
  assert.equal(hasIllustration("XYZ-99"), false);
  assert.equal(hasIllustration("toString"), false);
});

test("kit formats numbers and Hungarian suffixes", () => {
  assert.equal(formatNumber(0.75), "0,75");
  assert.equal(formatNumber(-1.5), "−1,5");
  assert.equal(gcd(12, 18), 6);
  assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 20].map(withInstrumental),
    ["2-vel", "3-mal", "4-gyel", "5-tel", "6-tal", "7-tel", "8-cal", "9-cel", "10-zel", "12-vel", "20-szal"]);
});

test("linear function rule reads naturally", () => {
  assert.equal(formula(1, 1), "f(x) = x + 1");
  assert.equal(formula(-1, -3), "f(x) = −x − 3");
  assert.equal(formula(0.5, 0), "f(x) = 0,5x");
  assert.equal(formula(0, -2), "f(x) = −2");
});
