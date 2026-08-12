import assert from "node:assert/strict";
import test from "node:test";
import { cacheUsefulness, calibrationProposal, DEFAULT_MODEL_ID, LOCAL_STATE_KEY, LOCAL_STATE_VERSION, loadLocalState, recomputeLocks, saveLocalState, setManualMastery, undoCalibrationProposal, updateProfileAndModel, usefulnessDisplayState, usefulnessFingerprint } from "../poc/state.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

const skillIds = ["ROOT", "CHILD", "OTHER"];
const graph = [
  { id: "ROOT", elofeltetel: [] },
  { id: "CHILD", elofeltetel: ["ROOT"] },
  { id: "OTHER", elofeltetel: [] },
];

test("local state defaults all skills and safely replaces corrupt storage", () => {
  const defaults = loadLocalState(memoryStorage(), skillIds);
  assert.equal(defaults.version, LOCAL_STATE_VERSION);
  assert.deepEqual(defaults.mastery, { ROOT: 0, CHILD: 0, OTHER: 0 });
  assert.deepEqual(defaults.profile, { erdeklodes: "", sajat: "", cel: "" });
  assert.equal(defaults.selectedModel, "openai/gpt-5.6-luna");

  const corrupt = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: "not json" }), skillIds);
  assert.deepEqual(corrupt, defaults);

  const unset = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({ version: 2, selectedModel: null }) }), skillIds);
  assert.equal(unset.selectedModel, DEFAULT_MODEL_ID);
});

test("prior local state migrates and retains only known, valid mastery values", () => {
  const storage = memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({
    version: 0,
    szintek: { ROOT: 4, CHILD: 2, REMOVED: 3 },
    profile: { erdeklodes: "zene" },
    selectedModel: "vendor/model",
    onboardingComplete: true,
    usefulnessCache: { ROOT: { text: "cached" } },
  }) });
  const state = loadLocalState(storage, skillIds);
  assert.deepEqual(state.mastery, { ROOT: 4, CHILD: 2, OTHER: 0 });
  assert.deepEqual(state.profile, { erdeklodes: "zene", sajat: "", cel: "" });
  assert.equal(state.selectedModel, "vendor/model");
  assert.equal(state.onboardingComplete, true);
  assert.deepEqual(state.usefulnessCache, {});
});

test("manual mastery persists and locks derive from persisted values without mutating them", () => {
  const storage = memoryStorage();
  let state = loadLocalState(storage, skillIds);
  state = setManualMastery(state, skillIds, "ROOT", 4);
  state = setManualMastery(state, skillIds, "CHILD", 3);
  saveLocalState(storage, state, skillIds);

  const restored = loadLocalState(storage, skillIds);
  assert.deepEqual(recomputeLocks(graph, restored.mastery), { ROOT: false, CHILD: false, OTHER: false });

  const blocked = { ...restored, mastery: { ...restored.mastery, ROOT: 1 } };
  assert.deepEqual(recomputeLocks(graph, blocked.mastery), { ROOT: false, CHILD: true, OTHER: false });
  assert.equal(blocked.mastery.CHILD, 3);
  assert.deepEqual(restored.mastery, { ROOT: 4, CHILD: 3, OTHER: 0 });

  saveLocalState(storage, { ...restored, worksheet: { completedProblems: ["p1"], suggestedMastery: { ROOT: 0 } } }, skillIds);
  assert.deepEqual(loadLocalState(storage, skillIds).mastery, { ROOT: 4, CHILD: 3, OTHER: 0 });
});

test("calibration marks selected skills at level 4, prerequisites at level 2, and review undo restores the baseline", () => {
  const calibrationGraph = [
    { id: "ROOT", elofeltetel: [] },
    { id: "MIDDLE", elofeltetel: ["ROOT"] },
    { id: "TARGET", elofeltetel: ["MIDDLE"] },
  ];
  const baseline = { ROOT: 1, MIDDLE: 0, TARGET: 3 };
  const proposed = calibrationProposal(calibrationGraph, baseline, ["TARGET"]);

  assert.deepEqual(proposed, { ROOT: 2, MIDDLE: 2, TARGET: 4 });
  assert.deepEqual(undoCalibrationProposal({ mastery: proposed }, baseline).mastery, baseline);
  assert.deepEqual(calibrationProposal(calibrationGraph, baseline, ["MIDDLE", "TARGET"]), { ROOT: 2, MIDDLE: 4, TARGET: 4 });
});

test("usefulness cache is fingerprinted and profile or model changes invalidate it", () => {
  let state = loadLocalState(memoryStorage(), skillIds);
  state = updateProfileAndModel(state, { erdeklodes: "zene", sajat: "", cel: "érettségi" }, "vendor/model-a");
  state = cacheUsefulness(state, "ROOT", "Kapcsolódik a zenéhez.");
  assert.equal(state.usefulnessCache.ROOT.fingerprint, usefulnessFingerprint(state.profile, state.selectedModel));

  state = updateProfileAndModel(state, { erdeklodes: "sport", sajat: "", cel: "érettségi" }, "vendor/model-a");
  assert.deepEqual(state.usefulnessCache, {});
  state = cacheUsefulness(state, "ROOT", "Új indoklás.");
  state = updateProfileAndModel(state, state.profile, "vendor/model-b");
  assert.deepEqual(state.usefulnessCache, {});
});

test("a failed usefulness refresh keeps a current cached explanation visible and retryable", () => {
  let state = loadLocalState(memoryStorage(), skillIds);
  state = updateProfileAndModel(state, { erdeklodes: "zene", sajat: "", cel: "érettségi" }, "vendor/model");
  state = cacheUsefulness(state, "ROOT", "A ritmusok arányainak megértésében is segít.");

  assert.deepEqual(usefulnessDisplayState(state, "ROOT", true), {
    text: "A ritmusok arányainak megértésében is segít.",
    refreshFailed: true,
  });
  assert.deepEqual(usefulnessDisplayState({ ...state, selectedModel: "vendor/other" }, "ROOT", true), {
    text: null,
    refreshFailed: false,
  });
});