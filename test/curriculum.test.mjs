import assert from "node:assert/strict";
import test from "node:test";
import { dependentsOf, findSkill, skills } from "../poc/curriculum.mjs";

test("the curriculum is one consistent, read-only graph", () => {
  assert.equal(skills.length, 190);
  assert.equal(skills.reduce((total, skill) => total + skill.prerequisites.length, 0), 281);
  for (const skill of skills) {
    for (const prerequisiteId of skill.prerequisites) {
      assert.ok(findSkill(prerequisiteId), `${skill.id} -> ${prerequisiteId}`);
      assert.ok(dependentsOf(prerequisiteId).includes(skill.id));
    }
  }
  assert.equal(findSkill("toString"), null);
  assert.deepEqual(dependentsOf("XYZ-99"), []);
  assert.throws(() => { skills[0].name = "x"; });
  assert.throws(() => { skills[0].prerequisites.push("x"); });
});
