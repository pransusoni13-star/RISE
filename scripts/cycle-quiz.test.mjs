import test from 'node:test';
import assert from 'node:assert/strict';
import { getCycleQuestions } from '../src/services/cycleQuiz.ts';

test('every supported goal has five valid questions', () => {
  for (const goal of ['coding', 'software-engineer', 'youtube', 'fitness', 'barbering', 'engineering', 'spirituality']) {
    const questions = getCycleQuestions(goal);
    assert.equal(questions.length, 5, goal);
    for (const question of questions) {
      assert.ok(question.options[question.answer]);
      assert.equal(new Set(question.options).size, question.options.length);
      assert.ok(question.explanation.length > 10);
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
