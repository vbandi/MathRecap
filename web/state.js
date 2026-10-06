// The signed-in learner's state, which lives on the server: loaded once from GET /api/me and changed
// through the /api/me endpoints. The browser keeps none of it.
import { api } from "./session.js";

export const MAX_LEVEL = 4;

// Browser storage keys of the versions that kept learner data in the browser. That data is not
// imported; the keys are only removed.
export const LEGACY_STORAGE_KEYS = Object.freeze(["mathrecap.local-state", "mathrecap.illustrationReview.v1"]);

export function removeLegacyStorage(getStorage) {
  try {
    const storage = getStorage();
    for (const key of LEGACY_STORAGE_KEYS) storage?.removeItem(key);
  } catch {
    // Storage can be unavailable (for example, blocked by the browser); then there is nothing to remove.
  }
}

// The learner from GET /api/me, with `mastery`: a level for every skill (0 for the ones without one).
export async function loadLearner(skillIds) {
  removeLegacyStorage(() => window.localStorage);
  const me = await api("GET", "/api/me");
  return { ...me, mastery: masteryFrom(skillIds, me.levels) };
}

export function sameProfile(first, second) {
  return ["interests", "background", "goal"].every((key) => first[key] === second[key]);
}

export function saveProfile(profile) {
  return api("PUT", "/api/me/profile", profile);
}

export function completeOnboarding() {
  return api("POST", "/api/me/onboarding-complete");
}

// The "why it is useful for you" text: the stored one unless `refresh`, otherwise a new one.
export async function requestUsefulness(skillId, refresh = false) {
  return (await api("POST", "/api/usefulness", { skillId, refresh })).usefulness.text;
}

// Sends level changes; keepalive lets the last ones reach the server while the page is left.
export function saveLevels(levels) {
  return api("PUT", "/api/me/levels", { levels }, { keepalive: true });
}

export function masteryFrom(skillIds, levels = {}) {
  return Object.fromEntries(skillIds.map((id) => [id, Number.isInteger(levels[id]) && levels[id] >= 0 && levels[id] <= MAX_LEVEL ? levels[id] : 0]));
}

// The skills whose level differs, with their level in `after`.
export function levelChanges(before, after) {
  return Object.fromEntries(Object.entries(after).filter(([id, level]) => (before[id] ?? 0) !== level));
}

// Keeps the levels the learner sees and saves their changes: the changes made within `delay` ms go out
// in one request, one request at a time. When a save fails, every unsaved change is undone and
// onRevert(levels, error) reports it, so nothing is lost silently.
export function createLevelSaver({ levels, save, onRevert, delay = 400 }) {
  let current = { ...levels };
  let saved = { ...levels };
  let timer = null;
  let queue = Promise.resolve(true);

  async function send() {
    const changes = levelChanges(saved, current);
    if (!Object.keys(changes).length) return true;
    try {
      await save(changes);
      saved = { ...saved, ...changes };
      return true;
    } catch (error) {
      current = { ...saved };
      onRevert({ ...current }, error);
      return false;
    }
  }

  // Saves the pending changes now; resolves to false when the save failed.
  function flush() {
    clearTimeout(timer);
    timer = null;
    queue = queue.then(send);
    return queue;
  }

  return {
    get levels() {
      return { ...current };
    },
    hasUnsavedChanges: () => Object.keys(levelChanges(saved, current)).length > 0,
    set(changes) {
      current = { ...current, ...changes };
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
  };
}

export function calibrationProposal(nodes, mastery, selectedSkillIds) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const selected = new Set(selectedSkillIds.filter((id) => byId.has(id)));
  const proposed = { ...mastery };
  const visitPrerequisites = (skillId) => {
    const skill = byId.get(skillId);
    if (!skill) return;
    for (const prerequisiteId of skill.prerequisites) {
      if (!selected.has(prerequisiteId)) proposed[prerequisiteId] = Math.max(proposed[prerequisiteId] ?? 0, 2);
      visitPrerequisites(prerequisiteId);
    }
  };
  for (const skillId of selected) {
    proposed[skillId] = MAX_LEVEL;
    visitPrerequisites(skillId);
  }
  return proposed;
}

export function recomputeLocks(nodes, mastery) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const locks = {};
  const visiting = new Set();
  function locked(id) {
    if (id in locks) return locks[id];
    if (visiting.has(id)) return true;
    visiting.add(id);
    const node = byId.get(id);
    const value = !node || node.prerequisites.some((prerequisiteId) => locked(prerequisiteId) || (mastery[prerequisiteId] ?? 0) < 2);
    visiting.delete(id);
    locks[id] = value;
    return value;
  }
  for (const node of nodes) locked(node.id);
  return locks;
}
