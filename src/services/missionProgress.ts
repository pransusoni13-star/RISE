const MIN_RESULT_CHARACTERS = 12;
const MIN_RESULT_WORDS = 3;

export function missionResultQuality(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const wordCount = normalized ? normalized.split(" ").length : 0;
  const passed = normalized.length >= MIN_RESULT_CHARACTERS && wordCount >= MIN_RESULT_WORDS;

  return {
    passed,
    normalized,
    wordCount,
    message: passed
      ? "Your mission is clear enough to start."
      : !normalized
        ? "Write the specific result you will finish."
        : `Make it more specific (${Math.min(normalized.length, MIN_RESULT_CHARACTERS)}/${MIN_RESULT_CHARACTERS} characters).`,
  };
}

export function stepsForMissionResult(value: string, completedSteps: number[]): number[] {
  const remaining = completedSteps.filter((step) => step !== 0);
  return missionResultQuality(value).passed
    ? Array.from(new Set([0, ...remaining])).sort((left, right) => left - right)
    : remaining.sort((left, right) => left - right);
}
