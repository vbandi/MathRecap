import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileExpression, isValidExpression, niceStep, sampleFunction, tickValues } from "../poc/figure-model.mjs";
import { parseWorksheetResponse } from "../server/schemas.mjs";

test("function expressions support school notation and evaluate correctly", () => {
  const cases = [
    ["2x^2 - 3", 2, 5], ["-x^2", 3, -9], ["2^-x", 2, 0.25], ["(x+1)(x-1)", 3, 8], ["2^3^2", 0, 512],
    ["sqrt(x+1)", 3, 2], ["0,5x + 1", 4, 3], ["3·x−2", 2, 4], ["abs(x) - 1", -4, 3], ["log(x)", 100, 2],
  ];
  for (const [source, x, expected] of cases) assert.equal(compileExpression(source)(x), expected, source);
  assert.ok(Math.abs(compileExpression("sin(pi/2)")(0) - 1) < 1e-12);
});

test("function expressions reject anything outside the whitelist", () => {
  for (const source of ["alert(1)", "y + 1", "constructor", "x)", "sin x", "", "x;1", "x".repeat(201)]) {
    assert.equal(isValidExpression(source), false, source);
  }
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

function worksheetWithPrompt(prompt) {
  return {
    title: "Háromszögek", explanation: [{ type: "text", value: "Szögek." }], assumedPrerequisites: [],
    workedExamples: [{ title: "Példa", steps: [{ type: "text", value: "Lépés" }] }],
    whyThisMatters: [{ type: "text", value: "Hasznos." }],
    exerciseGroups: [{ title: "Gyakorlás", problems: [{ id: "p1", prompt }] }],
    canChecklist: ["Tudom."],
    answers: [{ problemId: "p1", answer: [{ type: "text", value: "40°" }], reasoning: [{ type: "text", value: "Szögösszeg." }] }],
    diagnosticNotes: [], suggestedNextSteps: ["Tovább."],
  };
}

const triangle = {
  type: "figure", caption: "Az ABC háromszög",
  figure: {
    kind: "plane", size: "small", xRange: [-1, 7], yRange: [-1, 5],
    elements: [
      { shape: "polygon", points: [[0, 0], [6, 0], [2, 4]], filled: true },
      { shape: "point", at: [0, 0], label: "A" },
      { shape: "angle", vertex: [0, 0], from: [6, 0], to: [2, 4], label: "α" },
      { shape: "segment", from: [0, 0], to: [6, 0], label: "6 cm", ticks: 1 },
    ],
  },
};

test("figure parts are accepted in worksheet content", () => {
  const figures = [
    triangle,
    { type: "figure", figure: { kind: "plane", xRange: [-5, 5], yRange: [-3, 6], axes: true, grid: true, elements: [{ shape: "function", expression: "x^2 - 2", label: "f" }] } },
    { type: "figure", figure: { kind: "barChart", categories: ["H", "K"], series: [{ values: [3, 5] }] } },
    { type: "figure", figure: { kind: "pieChart", slices: [{ label: "A", value: 1 }, { label: "B", value: 3 }] } },
    { type: "figure", figure: { kind: "numberLine", range: [-3, 5], intervals: [{ from: -1, to: null, fromClosed: true }] } },
  ];
  const worksheet = parseWorksheetResponse(worksheetWithPrompt([{ type: "text", value: "Mekkora α?" }, ...figures]));
  assert.equal(worksheet.exerciseGroups[0].problems[0].prompt.length, 6);
  assert.deepEqual(worksheet.exerciseGroups[0].problems[0].prompt[5].figure.points, []);
});

test("invalid figure descriptions are rejected", () => {
  const invalidFigures = [
    { kind: "plane", xRange: [5, 1], yRange: [0, 1], elements: [{ shape: "point", at: [0, 0] }] },
    { kind: "plane", xRange: [0, 1], yRange: [0, 1], elements: [{ shape: "function", expression: "fetch(x)" }] },
    { kind: "plane", xRange: [0, 1], yRange: [0, 1], elements: [{ shape: "path", d: "M0 0" }] },
    { kind: "plane", xRange: [0, 1], yRange: [0, 1], elements: [{ shape: "point", at: [0, 0], style: "fill:red" }] },
    { kind: "barChart", categories: ["A", "B"], series: [{ values: [1] }] },
    { kind: "numberLine", range: [0, 10], intervals: [{ from: 5, to: 2 }] },
    { kind: "svg", markup: "<svg onload=alert(1)>" },
  ];
  for (const figure of invalidFigures) {
    assert.throws(() => parseWorksheetResponse(worksheetWithPrompt([{ type: "figure", figure }])), undefined, JSON.stringify(figure));
  }
});

test("figure renderer builds SVG through DOM APIs only", () => {
  const rendererSource = readFileSync(new URL("../poc/figures.js", import.meta.url), "utf8");
  assert.doesNotMatch(rendererSource, /(?:innerHTML|insertAdjacentHTML|outerHTML|DOMParser|eval\(|new Function)/);
  const modelSource = readFileSync(new URL("../poc/figure-model.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(modelSource, /(?:eval\(|new Function)/);
});
