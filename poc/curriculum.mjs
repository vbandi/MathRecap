// The curriculum graph, shared by the browser pages, the server and the tests.
import { skills as generatedSkills } from "./curriculum-data.mjs";

export const skills = Object.freeze(generatedSkills.map((skill) => Object.freeze({ ...skill, prerequisites: Object.freeze([...skill.prerequisites]) })));

const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
const dependentIds = new Map(skills.map((skill) => [skill.id, []]));
for (const skill of skills) {
  for (const prerequisiteId of skill.prerequisites) dependentIds.get(prerequisiteId).push(skill.id);
}
dependentIds.forEach((ids) => Object.freeze(ids));

export function findSkill(skillId) {
  return skillsById.get(skillId) ?? null;
}

// Skills that list skillId as a direct prerequisite.
export function dependentsOf(skillId) {
  return dependentIds.get(skillId) ?? [];
}
