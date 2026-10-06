import assert from "node:assert/strict";
import test from "node:test";
import { cacheUsefulness, calibrationProposal, LOCAL_STATE_KEY, LOCAL_STATE_VERSION, loadLocalState, recomputeLocks, saveLocalState, setManualMastery, undoCalibrationProposal, updateProfile, usefulnessDisplayState, usefulnessFingerprint } from "../../web/state.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

const skillIds = ["ROOT", "CHILD", "OTHER"];
const graph = [
  { id: "ROOT", prerequisites: [] },
  { id: "CHILD", prerequisites: ["ROOT"] },
  { id: "OTHER", prerequisites: [] },
];

test("local state defaults all skills and safely replaces corrupt storage", () => {
  const defaults = loadLocalState(memoryStorage(), skillIds);
  assert.equal(defaults.version, LOCAL_STATE_VERSION);
  assert.deepEqual(defaults.mastery, { ROOT: 0, CHILD: 0, OTHER: 0 });
  assert.deepEqual(defaults.profile, { interests: "", background: "", goal: "" });

  const corrupt = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: "not json" }), skillIds);
  assert.deepEqual(corrupt, defaults);
});

test("a model selected by earlier versions is dropped, since the server chooses the model", () => {
  const state = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({ version: LOCAL_STATE_VERSION, selectedModel: "vendor/model" }) }), skillIds);
  assert.equal("selectedModel" in state, false);
});

test("stored local state retains only known, valid mastery values", () => {
  const storage = memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({
    version: LOCAL_STATE_VERSION,
    mastery: { ROOT: 4, CHILD: 2, REMOVED: 3 },
    profile: { interests: "zene" },
    onboardingComplete: true,
    usefulnessCache: { ROOT: { text: "cached" } },
  }) });
  const state = loadLocalState(storage, skillIds);
  assert.deepEqual(state.mastery, { ROOT: 4, CHILD: 2, OTHER: 0 });
  assert.deepEqual(state.profile, { interests: "zene", background: "", goal: "" });
  assert.equal(state.onboardingComplete, true);
  assert.deepEqual(state.usefulnessCache, {});
});

test("legacy local state with Hungarian storage keys migrates to the current shape", () => {
  const legacyV0 = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({
    version: 0,
    szintek: { ROOT: 3 },
    profile: { erdeklodes: "zene", sajat: "törtek", cel: "érettségi" },
  }) }), skillIds);
  assert.equal(legacyV0.version, LOCAL_STATE_VERSION);
  assert.deepEqual(legacyV0.mastery, { ROOT: 3, CHILD: 0, OTHER: 0 });
  assert.deepEqual(legacyV0.profile, { interests: "zene", background: "törtek", goal: "érettségi" });

  const legacyV2 = loadLocalState(memoryStorage({ [LOCAL_STATE_KEY]: JSON.stringify({
    version: 2,
    mastery: { CHILD: 1 },
    profile: { erdeklodes: "sport" },
  }) }), skillIds);
  assert.deepEqual(legacyV2.mastery, { ROOT: 0, CHILD: 1, OTHER: 0 });
  assert.deepEqual(legacyV2.profile, { interests: "sport", background: "", goal: "" });
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
    { id: "ROOT", prerequisites: [] },
    { id: "MIDDLE", prerequisites: ["ROOT"] },
    { id: "TARGET", prerequisites: ["MIDDLE"] },
  ];
  const baseline = { ROOT: 1, MIDDLE: 0, TARGET: 3 };
  const proposed = calibrationProposal(calibrationGraph, baseline, ["TARGET"]);

  assert.deepEqual(proposed, { ROOT: 2, MIDDLE: 2, TARGET: 4 });
  assert.deepEqual(undoCalibrationProposal({ mastery: proposed }, baseline).mastery, baseline);
  assert.deepEqual(calibrationProposal(calibrationGraph, baseline, ["MIDDLE", "TARGET"]), { ROOT: 2, MIDDLE: 4, TARGET: 4 });
});

test("usefulness cache is fingerprinted and profile changes invalidate it", () => {
  let state = loadLocalState(memoryStorage(), skillIds);
  state = updateProfile(state, { interests: "zene", background: "", goal: "érettségi" });
  state = cacheUsefulness(state, "ROOT", "Kapcsolódik a zenéhez.");
  assert.equal(state.usefulnessCache.ROOT.fingerprint, usefulnessFingerprint(state.profile));

  state = updateProfile(state, { interests: "zene", background: "", goal: "érettségi" });
  assert.equal(state.usefulnessCache.ROOT.text, "Kapcsolódik a zenéhez.");

  state = updateProfile(state, { interests: "sport", background: "", goal: "érettségi" });
  assert.deepEqual(state.usefulnessCache, {});
});

test("a failed usefulness refresh keeps a current cached explanation visible and retryable", () => {
  let state = loadLocalState(memoryStorage(), skillIds);
  state = updateProfile(state, { interests: "zene", background: "", goal: "érettségi" });
  state = cacheUsefulness(state, "ROOT", "A ritmusok arányainak megértésében is segít.");

  assert.deepEqual(usefulnessDisplayState(state, "ROOT", true), {
    text: "A ritmusok arányainak megértésében is segít.",
    refreshFailed: true,
  });
  assert.deepEqual(usefulnessDisplayState({ ...state, profile: { ...state.profile, interests: "sport" } }, "ROOT", true), {
    text: null,
    refreshFailed: false,
  });
});