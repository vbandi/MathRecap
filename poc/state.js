export const LOCAL_STATE_KEY = "mathrecap.local-state";
export const LOCAL_STATE_VERSION = 2;
export const DEFAULT_MODEL_ID = "openai/gpt-5.6-luna";

const EMPTY_PROFILE = Object.freeze({ interests: "", background: "", goal: "" });

function masteryFor(skillIds, source = {}) {
  return Object.fromEntries(skillIds.map((id) => [id, Number.isInteger(source[id]) && source[id] >= 0 && source[id] <= 4 ? source[id] : 0]));
}

function profileFor(source = {}) {
  return Object.fromEntries(Object.keys(EMPTY_PROFILE).map((key) => [key, typeof source[key] === "string" ? source[key] : ""]));
}

function usefulnessCacheFor(source = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  return Object.fromEntries(Object.entries(source).flatMap(([skillId, entry]) => (
    entry && typeof entry === "object" && !Array.isArray(entry)
      && typeof entry.text === "string" && typeof entry.fingerprint === "string"
      ? [[skillId, { text: entry.text, fingerprint: entry.fingerprint }]] : []
  )));
}

export function usefulnessFingerprint(profile, selectedModel) {
  return JSON.stringify({
    modelId: selectedModel ?? "",
    interests: profile?.interests ?? "",
    background: profile?.background ?? "",
    goal: profile?.goal ?? "",
  });
}

export function usefulnessDisplayState(state, skillId, refreshFailed = false) {
  const cached = state?.usefulnessCache?.[skillId];
  const isCurrent = cached?.fingerprint === usefulnessFingerprint(state?.profile, state?.selectedModel);
  return {
    text: isCurrent ? cached.text : null,
    refreshFailed: Boolean(isCurrent && refreshFailed),
  };
}

export function emptyLocalState(skillIds) {
  return {
    version: LOCAL_STATE_VERSION,
    mastery: masteryFor(skillIds),
    profile: profileFor(),
    selectedModel: DEFAULT_MODEL_ID,
    onboardingComplete: false,
    usefulnessCache: {},
  };
}

function migrateLocalState(payload, skillIds) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return emptyLocalState(skillIds);
  return {
    version: LOCAL_STATE_VERSION,
    mastery: masteryFor(skillIds, payload.mastery),
    profile: profileFor(payload.profile),
    selectedModel: typeof payload.selectedModel === "string" && payload.selectedModel ? payload.selectedModel : DEFAULT_MODEL_ID,
    onboardingComplete: payload.onboardingComplete === true,
    usefulnessCache: usefulnessCacheFor(payload.usefulnessCache),
  };
}

export function loadLocalState(storage, skillIds) {
  try {
    const raw = storage?.getItem(LOCAL_STATE_KEY);
    return migrateLocalState(raw ? JSON.parse(raw) : null, skillIds);
  } catch {
    return emptyLocalState(skillIds);
  }
}

export function saveLocalState(storage, state, skillIds) {
  const normalized = migrateLocalState(state, skillIds);
  try {
    storage?.setItem(LOCAL_STATE_KEY, JSON.stringify(normalized));
  } catch {
    // Local persistence can be unavailable (for example, private browser storage).
  }
  return normalized;
}

export function setManualMastery(state, skillIds, skillId, level) {
  if (!skillIds.includes(skillId) || !Number.isInteger(level) || level < 0 || level > 4) return state;
  return { ...state, mastery: { ...state.mastery, [skillId]: level } };
}

export function updateProfileAndModel(state, profile, selectedModel) {
  const nextProfile = profileFor(profile);
  const nextModel = typeof selectedModel === "string" && selectedModel ? selectedModel : null;
  const changed = usefulnessFingerprint(state.profile, state.selectedModel) !== usefulnessFingerprint(nextProfile, nextModel);
  return {
    ...state,
    profile: nextProfile,
    selectedModel: nextModel,
    usefulnessCache: changed ? {} : state.usefulnessCache,
  };
}

export function cacheUsefulness(state, skillId, text) {
  if (typeof skillId !== "string" || typeof text !== "string" || !text.trim()) return state;
  return {
    ...state,
    usefulnessCache: {
      ...state.usefulnessCache,
      [skillId]: { text: text.trim(), fingerprint: usefulnessFingerprint(state.profile, state.selectedModel) },
    },
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
    proposed[skillId] = 4;
    visitPrerequisites(skillId);
  }
  return proposed;
}

export function undoCalibrationProposal(state, baselineMastery) {
  return { ...state, mastery: { ...baselineMastery } };
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