import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { needsInlineMathSeparator, orderedProblemPairs, studentProblems } from "../poc/worksheet-model.mjs";

const worksheet = {
  exerciseGroups: [{
    title: "Gyakorlás",
    problems: [
      { id: "first", prompt: [{ type: "text", value: "Első feladat" }] },
      { id: "second", prompt: [{ type: "text", value: "Második feladat" }] },
    ],
  }],
  answers: [
    { problemId: "second", answer: [{ type: "text", value: "Második válasz" }], reasoning: [{ type: "text", value: "Indoklás" }] },
    { problemId: "first", answer: [{ type: "text", value: "Első válasz" }], reasoning: [{ type: "text", value: "Indoklás" }] },
  ],
};

test("answer-key numbering follows the worksheet problem order, not answer order", () => {
  assert.deepEqual(orderedProblemPairs(worksheet).map(({ problem, answer }) => [problem.id, answer.problemId]), [
    ["first", "first"],
    ["second", "second"],
  ]);
});

test("student projection contains prompts only and rejects missing answer pairings", () => {
  assert.deepEqual(studentProblems(worksheet), [{
    groupTitle: "Gyakorlás",
    id: "first",
    prompt: [{ type: "text", value: "Első feladat" }],
  }, {
    groupTitle: "Gyakorlás",
    id: "second",
    prompt: [{ type: "text", value: "Második feladat" }],
  }]);
  assert.throws(() => orderedProblemPairs({ ...worksheet, answers: [] }), /Hiányzó megoldás: first/);
});

test("inline math retains word boundaries without adding a space before punctuation", () => {
  assert.equal(needsInlineMathSeparator({ value: "Számítsd ki a" }, { value: "5x + 2" }), true);
  assert.equal(needsInlineMathSeparator({ value: "5x + 2" }, { value: "helyettesítési értékét" }), true);
  assert.equal(needsInlineMathSeparator({ value: "5x + 2" }, { value: "." }), false);
  assert.equal(needsInlineMathSeparator({ value: "ha " }, { value: "x = 3" }), false);
});

test("model text stays out of HTML insertion APIs and KaTeX is untrusted", () => {
  const rendererSource = readFileSync(new URL("../poc/worksheet.js", import.meta.url), "utf8");
  assert.doesNotMatch(rendererSource, /(?:innerHTML|insertAdjacentHTML)/);
  assert.match(rendererSource, /trust: false/);
});

test("student worksheet renderer includes the settled student sections only", () => {
  const rendererSource = readFileSync(new URL("../poc/worksheet.js", import.meta.url), "utf8");
  const studentRenderer = rendererSource.match(/function renderWorksheet\(\) \{([\s\S]*?)\n\}/)?.[1];

  assert.ok(studentRenderer);
  for (const field of ["title", "explanation", "assumedPrerequisites", "workedExamples", "whyThisMatters", "canChecklist"]) {
    assert.match(studentRenderer, new RegExp(`worksheet\\.${field}`));
  }
  assert.match(studentRenderer, /studentProblems\(worksheet\)/);
  for (const field of ["answers", "reasoning", "diagnosticNotes", "suggestedNextSteps"]) {
    assert.doesNotMatch(studentRenderer, new RegExp(`worksheet\\.${field}`));
  }
  assert.doesNotMatch(studentRenderer, /(?:answer|date|dátum|név|name)[ -]?(?:line|field|input)/i);
});