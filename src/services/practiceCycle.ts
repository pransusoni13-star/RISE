import type { RiseProfile } from "./missionPlanner";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function canStartNextCycle(
  lastCompletedAt: string | undefined,
  now = new Date(),
): boolean {
  if (!lastCompletedAt) return false;
  const completed = new Date(lastCompletedAt);
  return (
    Number.isFinite(completed.getTime()) &&
    now.getTime() > completed.getTime() &&
    dayKey(now) !== dayKey(completed)
  );
}

export function nextPracticeCycle(
  profile: RiseProfile,
  lastCompletedAt: string | undefined,
  now = new Date(),
): Partial<RiseProfile> {
  if (!canStartNextCycle(lastCompletedAt, now))
    throw new Error("Your cycle is saved. The next one opens tomorrow.");
  return {
    skillStartDate: now.toISOString(),
    practiceCycle: Math.max(1, Math.floor(profile.practiceCycle || 1)) + 1,
  };
}
