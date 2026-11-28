import { isMemberDataLocked, recordProgressEvent } from "./auth";
import { consentRepository } from "./consentRepository";
import { createSevenDayPlan, loadProfile } from "./personalization";
import { missionRepository } from "./missionRepository";
import { addSkillXP, addXP, progressRepository } from "./progressEngine";
import { createSerializedMutationQueue } from "./serializedMutations";
import { getAvailableMissionDay } from "./dayUnlock";

const completeInOrder = createSerializedMutationQueue();

/** A deliberate completion tap is a self-report, not independent proof of ability. */
export function completeMission(missionId: string, note: string) {
  return completeInOrder(async () => {
    if (await isMemberDataLocked())
      throw new Error("Sign in to the account that owns this saved work.");
    if (!(await consentRepository.hasCurrentConsent()))
      throw new Error(
        "Review the current privacy and age information before continuing.",
      );
    const profile = await loadProfile();
    const plan = createSevenDayPlan(profile);
    const mission = plan.find((item) => item.id === missionId);
    if (!mission)
      throw new Error(
        "This plan has changed. Open your current task from Today.",
      );
    const record = await missionRepository.get(missionId);
    if (record.status === "completed") return { xp: 0, coins: 0 };
    const records = await missionRepository.list();
    const completedDays = plan
      .filter((item) =>
        records.some(
          (saved) =>
            saved.missionId === item.id && saved.status === "completed",
        ),
      )
      .map((item) => item.day);
    if (
      mission.day >
      getAvailableMissionDay(profile.skillStartDate, plan.length, completedDays)
    )
      throw new Error(
        "This task opens after today’s task and the daily wait. Return to Today.",
      );
    if (
      !mission.steps.every((_, index) => record.completedSteps.includes(index))
    )
      throw new Error("Finish each task step before saving your win.");
    const reflection = note.trim().slice(0, 1200);
    let credited = false;
    await progressRepository.update((current) => {
      if (
        current.events.some(
          (event) => event.metadata?.source === `proof:${missionId}`,
        )
      )
        return current;
      credited = true;
      return addSkillXP(
        addXP(
          current,
          mission.reward,
          "proof",
          `Completed: ${mission.title}`,
          mission.coinReward,
          {
            goal: mission.goal,
            skillId: mission.skillId,
            source: `proof:${missionId}`,
            passed: true,
          },
        ),
        mission.skillId,
        mission.reward,
        mission.goal,
      );
    });
    const completedAt = new Date().toISOString();
    await missionRepository.patch(missionId, {
      status: "completed",
      chosenResult: record.chosenResult || mission.title,
      reflection,
      completedAt,
      proof: {
        type: "text",
        uri: "",
        missionId,
        submittedAt: completedAt,
        description: reflection || `Completed: ${mission.title}`,
        review: {
          passed: true,
          checkedAt: completedAt,
          checks: [
            {
              id: "self_report",
              label: "Completion confirmed by you",
              passed: true,
              detail:
                "You tapped Save my win after completing the steps. RISE does not independently verify this result.",
            },
          ],
        },
      },
    });
    await recordProgressEvent({
      clientEventId: `mission:${missionId}`,
      eventType: "mission_completed",
      skillSlug: mission.skillId,
      minutes: mission.duration,
      metadata: { goal: mission.goal, proofType: "text", completedAt },
    }).catch(() => undefined);
    return {
      xp: credited ? mission.reward : 0,
      coins: credited ? mission.coinReward : 0,
    };
  });
}
