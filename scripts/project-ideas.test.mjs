import test from "node:test";
import assert from "node:assert/strict";
import { getProjectIdeaLevels } from "../src/services/projectIdeas.ts";

test("every project level gives three concrete choices", () => {
  const levels = getProjectIdeaLevels("ai-engineer", "AI Engineering");
  for (const difficulty of ["Easy", "Medium", "Hard", "Insane"]) {
    assert.equal(levels[difficulty].examples.length, 3);
    assert.ok(levels[difficulty].examples.every((idea) => idea.length > 20));
  }
});

test("project choices are personalized to the selected direction", () => {
  const ai = getProjectIdeaLevels("ai-engineer", "AI Engineering");
  const fitness = getProjectIdeaLevels("fitness", "Strength");
  assert.notDeepEqual(ai.Easy.examples, fitness.Easy.examples);
  assert.match(ai.Medium.examples.join(" "), /document|recommendation|image/i);
  assert.match(fitness.Medium.examples.join(" "), /strength|running|training/i);
});
