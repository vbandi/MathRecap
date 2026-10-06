import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileExpression, isValidExpression, niceStep, sampleFunction, tickValues } from "../../web/figure-model.mjs";

const expressionCases = JSON.parse(readFileSync(new URL("../fixtures/figure-expressions.json", import.meta.url), "utf8"));

test("function expressions support school notation and evaluate correctly", () => {
  for (const { expression, samples } of expressionCases.valid) {
    assert.equal(isValidExpression(expression), true, expression);
    const evaluate = compileExpression(expression);
    for (const [x, expected] of samples) {
      const actual = evaluate(x);
      if (expected === null) assert.equal(Number.isFinite(actual), false, `${expression} at ${x}`);
      else assert.ok(Math.abs(actual - expected) <= 1e-9, `${expression} at ${x}: ${actual} != ${expected}`);
    }
  }
});

test("function expressions reject anything outside the whitelist", () => {
  for (const { expression } of expressionCases.invalid) assert.equal(isValidExpression(expression), false, expression);
});

test("axis ticks use 1-2-5 steps without floating-point noise", () => {
  assert.equal(niceStep(10, 10), 1);
  assert.equal(niceStep(10, 4), 5);
  assert.equal(niceStep(0.7, 10), 0.1);
  assert.deepEqual(tickValues(-0.3, 0.3, 0.1), [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]);
});

test("sampled graphs split at asymptotes and undefined points", () => {
  assert.equal(sampleFunction(compileExpression("1/x"), [-5, 5], [-5, 5]).length, 2);
  const root = sampleFunction(compileExpression("sqrt(x)"), [-4, 4], [-1, 3]);
  assert.equal(root.length, 1);
  assert.ok(root[0].every(([x]) => x >= 0));
});

test("figure renderer builds SVG through DOM APIs only", () => {
  const rendererSource = readFileSync(new URL("../../web/figures.js", import.meta.url), "utf8");
  assert.doesNotMatch(rendererSource, /(?:innerHTML|insertAdjacentHTML|outerHTML|DOMParser|eval\(|new Function)/);
  const modelSource = readFileSync(new URL("../../web/figure-model.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(modelSource, /(?:eval\(|new Function)/);
});
