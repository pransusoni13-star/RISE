export function validateAuditReport(report) {
  if (!report || report.error || !report.metadata?.vulnerabilities || !report.vulnerabilities || Array.isArray(report.vulnerabilities)) {
    throw new Error("Dependency audit did not return a valid report. Check registry connectivity and rerun; vulnerability status is unknown.");
  }
  for (const severity of ['critical', 'high', 'moderate', 'low', 'info', 'total']) {
    const count = report.metadata.vulnerabilities[severity];
    if (!Number.isInteger(count) || count < 0) throw new Error(`Dependency audit returned an invalid ${severity} count.`);
  }
  return report;
}
