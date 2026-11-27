import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicLegalIdentity } from './release-identity.mjs';

const example = {
  EXPO_PUBLIC_OPERATOR_LEGAL_NAME: 'Sample Operator',
  EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS: '123 Sample Street, Toronto, ON M5V 2T6, Canada',
  EXPO_PUBLIC_LAUNCH_JURISDICTION: 'Ontario, Canada',
};

test('release identity accepts complete postal syntax without claiming the facts are verified', () => {
  assert.deepEqual(validatePublicLegalIdentity(example), []);
});

test('a contact email or city name cannot pass as a Canadian mailing address', () => {
  for (const address of ['support@example.com', 'RISE <support@example.com>', 'Brampton, Ontario, Canada']) {
    assert.ok(validatePublicLegalIdentity({ ...example, EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS: address }).length > 0);
  }
});

test('missing and placeholder operator facts fail the release check', () => {
  assert.ok(validatePublicLegalIdentity({ ...example, EXPO_PUBLIC_OPERATOR_LEGAL_NAME: '', EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS: 'TODO' }).length >= 2);
});
