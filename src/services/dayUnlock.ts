const DAY_MS = 24 * 60 * 60 * 1000;

function localDayStamp(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

export function getUnlockedDay(skillStartDate: string | undefined, cycleLength: number, now = new Date()): number {
  const parsed = skillStartDate ? new Date(skillStartDate) : now;
  const start = Number.isNaN(parsed.getTime()) ? now : parsed;
  const elapsed = Math.max(0, Math.floor((localDayStamp(now) - localDayStamp(start)) / DAY_MS));
  return Math.min(Math.max(1, cycleLength), elapsed + 1);
}

export function daysUntilMission(missionDay: number, unlockedDay: number): number {
  return Math.max(0, missionDay - unlockedDay);
}

/**
 * A mission is available only when both gates are satisfied:
 * 1. its local calendar day has arrived; and
 * 2. every earlier mission in the cycle is complete.
 *
 * Keeping this in one helper prevents alternate entry points (Today, Learn,
 * Missions, and the proof success screen) from disagreeing about what is open.
 */
export function getAvailableMissionDay(
  skillStartDate: string | undefined,
  cycleLength: number,
  completedDays: number[],
  now = new Date(),
): number {
  const calendarDay = getUnlockedDay(skillStartDate, cycleLength, now);
  const completed = new Set(completedDays.filter((day) => Number.isInteger(day) && day >= 1 && day <= cycleLength));
  let sequentialDay = 1;
  while (sequentialDay < cycleLength && completed.has(sequentialDay)) sequentialDay += 1;
  return Math.min(calendarDay, sequentialDay);
}

export function isMissionAvailable(
  missionDay: number,
  skillStartDate: string | undefined,
  cycleLength: number,
  completedDays: number[],
  now = new Date(),
): boolean {
  return missionDay <= getAvailableMissionDay(skillStartDate, cycleLength, completedDays, now);
}
