import test from 'node:test';
import assert from 'node:assert/strict';
import { missionResultQuality, stepsForMissionResult } from '../src/services/missionProgress.ts';

test('step one stays incomplete until a concrete mission result is entered', () => {
  assert.equal(missionResultQuality('').passed, false);
  assert.deepEqual(stepsForMissionResult('', [0, 2]), [2]);
  assert.equal(missionResultQuality('Do it today').passed, false);
});

test('a clear mission result completes only step one', () => {
  const result = 'Write three neutral customer interview questions';
  assert.equal(missionResultQuality(result).passed, true);
  assert.deepEqual(stepsForMissionResult(result, []), [0]);
  assert.deepEqual(stepsForMissionResult(result, [2]), [0, 2]);
});

test('removing the saved result removes automatic step one without erasing other progress', () => {
  assert.deepEqual(stepsForMissionResult('   ', [0, 1, 2]), [1, 2]);
});
