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
