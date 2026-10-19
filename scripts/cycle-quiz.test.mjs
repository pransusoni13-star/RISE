import test from 'node:test';
import assert from 'node:assert/strict';
import { getCycleQuestions, getQuizRank } from '../src/services/cycleQuiz.ts';

test('every supported goal has seven valid mastery questions', () => {
  for (const goal of ['coding', 'software-engineer', 'youtube', 'fitness', 'barbering', 'engineering', 'spirituality', 'personal', 'unmapped-custom-goal']) {
    const questions = getCycleQuestions(goal);
    assert.equal(questions.length, 7, goal);
    for (const question of questions) {
      assert.ok(question.options[question.answer]);
      assert.equal(new Set(question.options).size, question.options.length);
      assert.ok(question.explanation.length > 10);
      assert.ok(['Remember', 'Apply', 'Prove', 'Improve'].includes(question.focus));
    }
  }
});

test('coding and React Native receive coding-specific questions', () => {
  for (const goal of ['coding', 'react-native', 'software-engineer']) {
    assert.ok(getCycleQuestions(goal).some(q => q.question.includes('TypeScript')), goal);
  }
});

test('creator review does not default to programming questions', () => {
  const questions = getCycleQuestions('youtube');
  assert.ok(questions.some(q => q.question.includes('viewers')));
  assert.ok(questions.every(q => !q.question.includes('TypeScript')));
});

test('mixed goals include both selected domains', () => {
  const questions = getCycleQuestions('coding', 'coding fitness');
  assert.ok(questions.some(q => q.question.includes('feature')));
  assert.ok(questions.some(q => q.question.includes('progression')));
});

test('additional life and career domains use relevant question banks', () => {
  const cases = [
    ['graphic-design', 'visual hierarchy'],
    ['business', 'business test'],
    ['communication', 'active listening'],
    ['finance', 'spending plan'],
    ['personal habits', 'habit'],
    ['spirituality', 'spiritual guidance'],
    ['study', 'understanding'],
  ];
  for (const [goal, phrase] of cases) {
    assert.ok(getCycleQuestions(goal).some(q => q.question.toLowerCase().includes(phrase)), goal);
  }
});

test('mission context creates questions about the work the member just learned', () => {
  const questions = getCycleQuestions('software-engineer', 'software-engineer', {
    focusSkill: 'API error handling',
    missionTitle: 'Handle one failed request',
    missionSteps: ['Trigger a failed request and show a useful retry state.'],
    successCriteria: 'The app shows a clear error and a working retry button.',
  });
  assert.equal(questions.length, 7);
  assert.ok(questions.some(q => q.question.includes('Handle one failed request')));
  assert.ok(questions.some(q => q.options.includes('Trigger a failed request and show a useful retry state.')));
  assert.ok(questions.some(q => q.options.includes('The app shows a clear error and a working retry button.')));
});

test('RISE ranks are stable at every score boundary', () => {
  assert.equal(getQuizRank(0).name, 'Foundation');
  assert.equal(getQuizRank(50).name, 'Climber');
  assert.equal(getQuizRank(70).name, 'Pathfinder');
  assert.equal(getQuizRank(85).name, 'Vanguard');
  assert.equal(getQuizRank(100).name, 'Ascendant');
  assert.equal(getQuizRank(999).name, 'Ascendant');
});
