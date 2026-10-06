import assert from "node:assert/strict";
import test from "node:test";
import { calibrationProposal, createLevelSaver, LEGACY_STORAGE_KEYS, levelChanges, masteryFrom, recomputeLocks, removeLegacyStorage, sameProfile } from "../../web/state.js";

const graph = [
  { id: "ROOT", prerequisites: [] },
  { id: "CHILD", prerequisites: ["ROOT"] },
  { id: "OTHER", prerequisites: [] },
];
const skillIds = graph.map(({ id }) => id);

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, removeItem: (key) => values.delete(key) };
}

// A save function whose calls stay pending until the test settles them.
function pendingSaves() {
  const calls = [];
  const save = (changes) => new Promise((resolve, reject) => calls.push({ changes, resolve, reject }));
  return { calls, save };
}

test("mastery has a level for every known skill, 0 when the server has none", () => {
  assert.deepEqual(masteryFrom(skillIds, { ROOT: 4, REMOVED: 3, CHILD: 9, OTHER: 1.5 }), { ROOT: 4, CHILD: 0, OTHER: 0 });
  assert.deepEqual(masteryFrom(skillIds), { ROOT: 0, CHILD: 0, OTHER: 0 });
});

test("level changes list the skills whose level differs", () => {
  assert.deepEqual(levelChanges({ ROOT: 1, CHILD: 2 }, { ROOT: 1, CHILD: 0, OTHER: 3 }), { CHILD: 0, OTHER: 3 });
  assert.deepEqual(levelChanges({ ROOT: 1 }, { ROOT: 1, OTHER: 0 }), {});
});

test("profiles are the same when all three texts are", () => {
  const profile = { interests: "zene", background: "", goal: "érettségi" };
  assert.equal(sameProfile(profile, { goal: "érettségi", interests: "zene", background: "" }), true);
  assert.equal(sameProfile(profile, { ...profile, background: "kilencedikes" }), false);
});

test("the old browser storage keys are removed, nothing else, and blocked storage is tolerated", () => {
  const storage = memoryStorage({ "mathrecap.local-state": "{}", "mathrecap.illustrationReview.v1": "{}", "mathrecap.tree-view": "{}" });

  removeLegacyStorage(() => storage);

  assert.deepEqual([...storage.values.keys()], ["mathrecap.tree-view"]);
  assert.deepEqual(LEGACY_STORAGE_KEYS, ["mathrecap.local-state", "mathrecap.illustrationReview.v1"]);
  assert.doesNotThrow(() => removeLegacyStorage(() => { throw new Error("SecurityError"); }));
  assert.doesNotThrow(() => removeLegacyStorage(() => null));
});

test("level changes made close together are saved in one request", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const saved = [];
  const saver = createLevelSaver({ levels: { ROOT: 0, CHILD: 0 }, save: async (changes) => { saved.push(changes); }, onRevert: () => assert.fail("no revert"), delay: 400 });

  saver.set({ ROOT: 3 });
  t.mock.timers.tick(200);
  saver.set({ CHILD: 2 });
  saver.set({ ROOT: 4 });
  assert.deepEqual(saver.levels, { ROOT: 4, CHILD: 2 });
  assert.equal(saver.hasUnsavedChanges(), true);
  t.mock.timers.tick(399);
  assert.deepEqual(saved, []);
  t.mock.timers.tick(1);
  await saver.flush();

  assert.deepEqual(saved, [{ ROOT: 4, CHILD: 2 }]);
  assert.equal(saver.hasUnsavedChanges(), false);
});

test("a failed save restores the saved levels and reports it", async () => {
  const reverts = [];
  const saver = createLevelSaver({ levels: { ROOT: 1, CHILD: 0 }, save: async () => { throw new Error("Hálózati hiba"); }, onRevert: (levels, error) => reverts.push({ levels, message: error.message }) });

  saver.set({ ROOT: 4, CHILD: 2 });
  const result = await saver.flush();

  assert.equal(result, false);
  assert.deepEqual(saver.levels, { ROOT: 1, CHILD: 0 });
  assert.deepEqual(reverts, [{ levels: { ROOT: 1, CHILD: 0 }, message: "Hálózati hiba" }]);
  assert.equal(saver.hasUnsavedChanges(), false);
});

test("one save runs at a time, and the next one sends only what changed since", async () => {
  const { calls, save } = pendingSaves();
  const saver = createLevelSaver({ levels: { ROOT: 0, CHILD: 0 }, save, onRevert: () => assert.fail("no revert") });

  saver.set({ ROOT: 2 });
  const first = saver.flush();
  await Promise.resolve();
  saver.set({ CHILD: 3 });
  const second = saver.flush();
  await Promise.resolve();
  assert.deepEqual(calls.map(({ changes }) => changes), [{ ROOT: 2 }]);

  calls[0].resolve();
  assert.equal(await first, true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.map(({ changes }) => changes), [{ ROOT: 2 }, { CHILD: 3 }]);
  calls[1].resolve();
  assert.equal(await second, true);
  assert.deepEqual(saver.levels, { ROOT: 2, CHILD: 3 });
});

test("nothing is sent when the levels are back to the saved ones", async () => {
  const { calls, save } = pendingSaves();
  const saver = createLevelSaver({ levels: { ROOT: 1 }, save, onRevert: () => assert.fail("no revert") });

  saver.set({ ROOT: 3 });
  saver.set({ ROOT: 1 });

  assert.equal(await saver.flush(), true);
  assert.deepEqual(calls, []);
});

test("locks derive from the levels without changing them", () => {
  const mastery = { ROOT: 4, CHILD: 3, OTHER: 0 };
  assert.deepEqual(recomputeLocks(graph, mastery), { ROOT: false, CHILD: false, OTHER: false });
  assert.deepEqual(recomputeLocks(graph, { ...mastery, ROOT: 1 }), { ROOT: false, CHILD: true, OTHER: false });
  assert.deepEqual(mastery, { ROOT: 4, CHILD: 3, OTHER: 0 });
});

test("calibration marks selected skills at level 4 and their prerequisites at least at level 2", () => {
  const calibrationGraph = [
    { id: "ROOT", prerequisites: [] },
    { id: "MIDDLE", prerequisites: ["ROOT"] },
    { id: "TARGET", prerequisites: ["MIDDLE"] },
  ];
  const baseline = { ROOT: 1, MIDDLE: 0, TARGET: 3 };

  assert.deepEqual(calibrationProposal(calibrationGraph, baseline, ["TARGET"]), { ROOT: 2, MIDDLE: 2, TARGET: 4 });
  assert.deepEqual(calibrationProposal(calibrationGraph, baseline, ["MIDDLE", "TARGET"]), { ROOT: 2, MIDDLE: 4, TARGET: 4 });
  assert.deepEqual(calibrationProposal(calibrationGraph, baseline, []), baseline);
  assert.deepEqual(levelChanges(baseline, calibrationProposal(calibrationGraph, baseline, ["TARGET"])), { ROOT: 2, MIDDLE: 2, TARGET: 4 });
  assert.deepEqual(baseline, { ROOT: 1, MIDDLE: 0, TARGET: 3 });
});
