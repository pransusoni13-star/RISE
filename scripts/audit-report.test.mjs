import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuditReport } from './audit-report.mjs';

test('failed audit requests cannot be reported as zero vulnerabilities', () => {
  for (const report of [null, {}, { error: { code: 'ENOTFOUND' } }, { vulnerabilities: {} }]) {
    assert.throws(() => validateAuditReport(report), /valid report/);
  }
});

test('audit requires complete numeric counts and accepts a valid clean report', () => {
  const report = { vulnerabilities: {}, metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 } } };
  assert.equal(validateAuditReport(report), report);
  assert.throws(() => validateAuditReport({ ...report, metadata: { vulnerabilities: { ...report.metadata.vulnerabilities, high: 'unknown' } } }), /invalid high/);
});
