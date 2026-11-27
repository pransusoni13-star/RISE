export function validatePublicLegalIdentity(values) {
  const problems = [];
  for (const [name, raw] of Object.entries(values)) {
    const value = raw?.trim() || '';
    if (!value || /^(your|todo|tbd|placeholder|example)/i.test(value)) {
      problems.push(`Set ${name} to verified public information and add the same value to the EAS production environment.`);
    }
  }
  const address = values.EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS?.trim() || '';
  if (address && /[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/.test(address)) {
    problems.push('EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS must be a physical postal address, not an email contact.');
  }
  if (address && /canada/i.test(values.EXPO_PUBLIC_LAUNCH_JURISDICTION || '') && !/\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i.test(address)) {
    problems.push('The Canadian operator mailing address needs a valid-format postal code as well as its street or PO box, city, province, and country.');
  }
  return problems;
}
