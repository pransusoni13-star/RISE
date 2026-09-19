export type AIRecommendationInput = {
  goal?: string;
  currentSkill?: string;
  weakSkill?: string;
  strongSkill?: string;
  recentActivity?: string[];
  quizScore?: number;
  timeAvailable?: number;
  accountabilityStyle?: string;
};

export type AIRecommendation = {
  title: string;
  description: string;
  why: string;
  nextStep: string;
  mode: "local-fallback";
};

export type AIProofEvaluation = {
  status: "pending" | "needs-improvement";
  summary: string;
  strengths: string[];
  gaps: string[];
  nextStep: string;
  mode: "local-fallback";
};

export interface RISEAIService {
  generateRecommendation(input: AIRecommendationInput): AIRecommendation;
  evaluateProof(input: {
    goal?: string;
    evidence?: string;
    reflection?: string;
  }): AIProofEvaluation;
  evaluateQuiz(input: {
    score: number;
    goal?: string;
    weakConcepts?: string[];
  }): {
    summary: string;
    strongConcepts: string[];
    weakConcepts: string[];
    nextRecommendation: string;
    mode: "local-fallback";
  };
}

export function createLocalFallbackAIService(): RISEAIService {
  return {
    generateRecommendation(input) {
      const goal = input.goal || "your goal";
      const currentSkill = input.currentSkill || "your current skill";
      const weakSkill = input.weakSkill || "core fundamentals";
      const recentActivity = input.recentActivity?.[0] || "a recent learning step";

      const title =
        input.quizScore !== undefined && input.quizScore < 65
          ? `Review ${weakSkill}`
          : `Advance ${currentSkill}`;

      const description =
        input.quizScore !== undefined && input.quizScore < 65
          ? `RISE recommends a shorter, lower-friction lesson around ${weakSkill} before you move further in ${goal}.`
          : `RISE recommends continuing with ${currentSkill} and moving toward a higher-value mission or project in ${goal}.`;

      return {
        title,
        description,
        why: `This recommendation is based on your recent activity (${recentActivity}) and your current performance in ${goal}.`,
        nextStep:
          input.quizScore !== undefined && input.quizScore < 65
            ? "Complete a short practice block, then retake a focused quiz."
            : "Start the next mission or project, then submit proof of the result.",
        mode: "local-fallback",
      };
    },

    evaluateProof(input) {
      const evidence = input.evidence?.trim() || "uploaded evidence";
      const reflection = input.reflection?.trim() || "your reflection";

      const strengths = [
        "You submitted concrete evidence for your work.",
      ];

      const gaps = [
        "Add a clearer explanation of what changed and why it mattered.",
      ];

      const nextStep =
        reflection.length < 40
          ? "Add a stronger reflection explaining your learning and the next improvement."
          : "Keep the proof, then move to the next mission or project when ready.";

      return {
        status: reflection.length < 40 ? "needs-improvement" : "pending",
        summary: `RISE received ${evidence} and a reflection that shows effort and follow-through.`,
        strengths,
        gaps,
        nextStep,
        mode: "local-fallback",
      };
    },

    evaluateQuiz(input) {
      const quizScore = Math.max(0, Math.min(100, input.score));
      const weakConcepts = input.weakConcepts && input.weakConcepts.length > 0
        ? input.weakConcepts
        : ["Foundations"];

      const strongConcepts =
        quizScore >= 80
          ? ["You are ready for a harder next step."]
          : ["You understand the basics, but there is still room to improve."];

      return {
        summary:
          quizScore >= 80
            ? "Strong result. RISE can move you toward a more demanding next step."
            : "Solid start. RISE recommends reinforcing the weak areas before moving forward.",
        strongConcepts,
        weakConcepts,
        nextRecommendation:
          quizScore >= 80
            ? "Move into a harder mission or project."
            : "Repeat a brief learning block and retest the weak concept.",
        mode: "local-fallback",
      };
    },
  };
}

export const aiService = createLocalFallbackAIService();
