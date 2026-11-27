import test from 'node:test';
import assert from 'node:assert/strict';
import { createSevenDayPlan, getRecommendedSkills, parseMissionPayload } from '../src/services/missionPlanner.ts';

const profile = (changes = {}) => ({
  selectedGoals: ['custom-life'], customGoal: 'Can I become the best Beyblader of all time?',
  weeklySkill: 'Launch control', focusSkills: ['Launch control'],
  skillStartDate: '2026-11-26T12:00:00Z', planIdentityVersion: 2, ...changes,
});

test('a custom Beyblade goal starts with a measurable launch drill, not coding or vague foundations', () => {
  for (const goal of ['custom-life', 'custom-career', 'personal']) {
    const plan = createSevenDayPlan(profile({ selectedGoals: [goal] }));
    assert.equal(plan.length, 7);
    assert.match(plan[0].title, /launch consistency/i);
    assert.match(plan[0].steps[0], /ten launches/i);
    assert.match(plan[0].safetyNote, /enclosed stadium/);
    assert.doesNotMatch(JSON.stringify(plan), /TypeScript|React Native|Define your 1%/);
    assert.match(plan[6].title, /retest/i);
    assert.match(getRecommendedSkills(goal, profile().customGoal).join(' '), /Launch control/);
  }
});

test('a custom focus is retained instead of silently replaced by preset skills', () => {
  const plan = createSevenDayPlan(profile({ customGoal: 'Improve my pottery', weeklySkill: 'Wheel centering', focusSkills: ['Wheel centering'] }));
  assert.ok(plan.every(m => m.focusSkill === 'Wheel centering'));
  assert.match(plan[0].title, /Wheel centering/);
  assert.match(plan[0].steps[0], /pottery/);
});

test('software engineer selects software missions before the broader engineering template', () => {
  const plan = createSevenDayPlan(profile({ selectedGoals: ['software-engineer'], customGoal: 'Software Engineer', weeklySkill: 'TypeScript', focusSkills: ['TypeScript'] }));
  assert.match(JSON.stringify(plan), /code|function|software/i);
  assert.doesNotMatch(plan[0].title, /real constraint/);
});

test('custom subjects are retained when a goal also says study or program', () => {
  const cases = [
    ['Study piano every day', /passage|rhythm/],
    ['Study photography', /Photograph one still object/],
    ['Start a fitness program', /chair sit-to-stands/],
    ['Study programming', /repeated problem/],
    ['Become a lawyer', /case summary/],
    ['Study medicine', /study questions/],
  ];
  for (const [customGoal, expected] of cases) {
    const plan = createSevenDayPlan(profile({customGoal,focusSkills:getRecommendedSkills('custom-life',customGoal)}));
    assert.match(plan[0].steps[0], expected, customGoal);
  }
  const fishing = createSevenDayPlan(profile({customGoal:'Learn to tie fishing hooks',focusSkills:['Knot tying']}));
  assert.doesNotMatch(fishing[0].steps[0], /video|audience|opening hooks/i);
});

test('whole-word goal matching avoids unrelated faith, barbering, and creator plans', () => {
  const game = createSevenDayPlan(profile({ customGoal: 'Become a Godot video game developer', focusSkills: ['Game development'] }));
  assert.equal(game[0].title, 'Define one user problem');
  assert.ok(game.every(m => m.sourceNote === undefined));
  const chair = createSevenDayPlan(profile({ customGoal: 'Build a wooden chair', focusSkills: ['Wood joinery'] }));
  assert.doesNotMatch(chair.map(m => m.steps.join(' ')).join(' '), /hairline|clipper|fade/i);
});

test('balanced goals begin each track at its first lesson and keep custom context separate', () => {
  const plan = createSevenDayPlan(profile({ selectedGoals: ['software-engineer', 'custom-life'], customGoal: 'Software Engineer + Become a Beyblader', focusSkills: ['TypeScript', 'Launch control'] }));
  assert.equal(plan[0].goal, 'software-engineer');
  assert.equal(plan[1].goal, 'custom-life');
  assert.match(plan[1].title, /launch consistency/i);
  assert.match(plan[3].title, /launch angle/i);
  assert.doesNotMatch(plan[0].steps.join(' '), /Beyblade|stadium/i);
});

test('changing a custom goal cannot reuse completed mission identities', () => {
  const first = createSevenDayPlan(profile());
  const second = createSevenDayPlan(profile({ customGoal: 'Learn pottery' }));
  assert.notEqual(first[0].id, second[0].id);
  assert.deepEqual(first.map(m => m.id), createSevenDayPlan(profile()).map(m => m.id));
});

test('existing plans retain legacy mission IDs when their progress is loaded', () => {
  const oldProfile = profile({ planIdentityVersion: undefined });
  const old = createSevenDayPlan(oldProfile);
  // Hash of the original selectedGoals-only identity, before this release.
  let hash = 2166136261;
  for (const character of 'custom-life') { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  assert.equal(old[0].id, `plan-${(hash >>> 0).toString(36)}-launch-control-2026-11-26-day-1`);
});

test('private goal and custom skill text stay out of external search URLs', () => {
  const plan = createSevenDayPlan(profile({ customGoal: 'Private goal for SECRET_PERSON', focusSkills: ['SECRET_SKILL'], weeklySkill: 'SECRET_SKILL' }));
  assert.ok(plan.every(m => !decodeURIComponent(m.resourceUrl).includes('SECRET')));
  const coding = createSevenDayPlan(profile({ selectedGoals: ['software-engineer'], focusSkills: ['SECRET_SKILL'], weeklySkill: 'SECRET_SKILL' }));
  assert.ok(coding.every(m => !decodeURIComponent(m.resourceUrl).includes('SECRET')));
});

test('advertised non-coding goals receive concrete practice tasks', () => {
  const cases = [['fitness', /chair/i], ['basketball', /dribble/i], ['student', /recall/i], ['photography', /photograph/i], ['music', /rhythm/i], ['finance', /spending plan/i], ['law', /case summary/i], ['medicine', /study questions/i]];
  for (const [goal, task] of cases) {
    const plan = createSevenDayPlan(profile({ selectedGoals: [goal], customGoal: goal, weeklySkill: getRecommendedSkills(goal)[0], focusSkills: [getRecommendedSkills(goal)[0]] }));
    assert.match(plan[0].steps[0], task, goal);
    assert.doesNotMatch(plan[0].steps[0], /code|TypeScript|React Native/, goal);
  }
});

test('all cycle lengths have distinct missions and stable identities', () => {
  for (const length of [7, 10, 30]) {
    const plan = createSevenDayPlan(profile({ commitment: `Every ${length} days` }));
    assert.equal(plan.length, length);
    assert.equal(new Set(plan.map(m => m.id)).size, length);
    assert.ok(plan.every(m => m.steps.length > 0 && m.duration > 0));
  }
});

test('mission navigation preserves the generated task and rejects broken links without generic defaults', () => {
  const mission = createSevenDayPlan(profile())[0];
  assert.deepEqual(parseMissionPayload(JSON.stringify(mission)), JSON.parse(JSON.stringify(mission)));
  for (const raw of [undefined, '{broken', '{}', 'null', JSON.stringify({ ...mission, track: {} }), JSON.stringify({ ...mission, focusSkill: null }), JSON.stringify({ ...mission, goal: undefined }), JSON.stringify({ ...mission, resourceUrl: 'javascript:alert(1)' })]) {
    assert.equal(parseMissionPayload(raw), null);
  }
});
