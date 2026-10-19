export type QuizFocus = "Remember" | "Apply" | "Prove" | "Improve";

export type CycleQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  focus: QuizFocus;
};

export type QuizLearningContext = {
  focusSkill?: string;
  missionTitle?: string;
  missionSteps?: string[];
  successCriteria?: string;
  reflectionPrompt?: string;
};

export type QuizRank = {
  name: "Foundation" | "Climber" | "Pathfinder" | "Vanguard" | "Ascendant";
  minimum: number;
  nextName?: QuizRank["name"];
  nextMinimum?: number;
};

const question = (focus: QuizFocus, prompt: string, options: string[], answer: number, explanation: string): CycleQuestion => ({ focus, question: prompt, options, answer, explanation });

const shared: CycleQuestion[] = [
  question("Prove", "What best proves real improvement?", ["Tapping complete", "A visible result compared with a clear target", "Time passing", "Earning coins"], 1, "Proof should show the work, the target, and what changed—not just that a button was tapped."),
  question("Improve", "What makes the next practice attempt useful?", ["Changing everything", "Repeating without review", "Improving one weakness revealed by feedback", "Avoiding every mistake"], 2, "Focused practice uses evidence from the last attempt to improve one specific weakness."),
  question("Apply", "What belongs in a strong two-sentence reflection?", ["What you did, what you learned, and the next adjustment", "Only that you finished", "A copied definition", "Your reward total"], 0, "A useful reflection connects action, learning, and the next change you will make."),
  question("Remember", "How should a learning source be checked?", ["Trust the first result", "Check expertise, evidence, date, context, and other strong sources", "Follow the most popular creator", "Ignore who published it"], 1, "A reliable source is current, evidence-based, relevant to the task, and supported by credible expertise."),
  question("Improve", "You miss a question. What is the strongest response?", ["Memorize the option only", "Review why it was wrong, explain the right idea, then apply it", "Skip the topic", "Restart the whole plan"], 1, "Correction plus explanation and application turns a mistake into durable learning."),
  question("Apply", "A skill feels too large to practise well. What is the best move?", ["Wait until you understand everything", "Choose one small result and finish it with care", "Start several versions", "Measure only time"], 1, "A small finished result creates evidence you can inspect and improve."),
  question("Prove", "Which comparison teaches you the most?", ["Your result against a clear success criterion", "Your reward against another person’s", "Your time against a random task", "Your plan against a motivational post"], 0, "A clear criterion shows what worked and what the next attempt should change."),
];

const banks: Record<string, CycleQuestion[]> = {
  coding: [
    question("Remember", "Why are TypeScript types useful?", ["They replace testing", "They describe expected data and catch many mistakes earlier", "They publish the app", "They make every file longer"], 1, "Types make data expectations explicit and catch many mismatches before runtime; testing is still required."),
    question("Apply", "What is the strongest way to test a feature?", ["Only read the code", "Test the main flow and a realistic failure case", "Assume it works after compiling", "Change several features first"], 1, "A useful test checks both the intended path and a likely failure state."),
    question("Improve", "A feature fails only for some users. What should you do first?", ["Rewrite the whole app", "Reproduce the exact conditions and inspect the smallest failing path", "Hide the error", "Add more features"], 1, "Reproducing the conditions narrows the cause and prevents random changes from creating new bugs."),
  ],
  creator: [
    question("Apply", "What should a strong opening do first?", ["Ask for a subscription", "Deliver on the title and thumbnail promise", "Show a long logo animation", "Explain the creator’s history"], 1, "The opening should quickly confirm the value promised to the viewer."),
    question("Remember", "Which metric shows where viewers stay or leave?", ["File size", "Audience retention", "Upload filename", "Camera model"], 1, "Audience retention reveals the moments that hold or lose attention."),
    question("Improve", "Retention drops at one moment. What is the best next test?", ["Change the whole channel", "Shorten or clarify that moment and compare the next result", "Ignore it", "Buy a new camera"], 1, "Change one likely cause and compare results so the lesson is measurable."),
  ],
  fitness: [
    question("Apply", "What is a safe progression?", ["Increase everything at once", "Add a manageable challenge while maintaining form and recovery", "Train through sharp pain", "Copy an advanced plan exactly"], 1, "Progress should be gradual and preserve safe technique and recovery."),
    question("Remember", "When should a session stop?", ["With sharp pain, dizziness, or unusual symptoms", "When form is controlled", "After a warm-up", "When the plan is personalized"], 0, "Sharp pain, dizziness, or unusual symptoms are reasons to stop and seek appropriate guidance."),
    question("Improve", "Form breaks down near the end of every set. What is the best adjustment?", ["Add more weight", "Reduce the load or reps and rebuild controlled form", "Move faster", "Ignore it"], 1, "Quality comes before intensity. A manageable regression creates a safer base for progress."),
  ],
  barbering: [
    question("Remember", "What comes before using tools on another person?", ["Taking a photo", "Consent, consultation, sanitation, and a safe plan", "Choosing a filter", "Working quickly"], 1, "Consent, consultation, and sanitation protect both client and barber."),
    question("Apply", "How should a visible guideline be corrected?", ["Use controlled corner work and small guard changes", "Push the fade much higher", "Press harder", "Ignore the transition"], 0, "Small, controlled changes reduce the risk of creating another line."),
    question("Prove", "What proof best shows clipper-control improvement?", ["A tool photo", "Comparable before-and-after views in consistent lighting", "A written claim", "A product receipt"], 1, "Comparable views make the transition and improvement visible."),
  ],
  engineering: [
    question("Remember", "What makes an engineering test useful?", ["Changing conditions during the test", "One clear metric and repeatable conditions", "No written result", "Testing only the final product"], 1, "Repeatable conditions and a clear metric make results comparable."),
    question("Apply", "Why build a small prototype?", ["To prove every assumption", "To test the riskiest assumption early", "To avoid user needs", "To skip safety review"], 1, "A small prototype tests the core uncertainty before major time or materials are spent."),
    question("Improve", "A prototype misses its target. What comes next?", ["Hide the result", "Use the measurement to revise one assumption and retest", "Add unrelated features", "Call it finished"], 1, "A controlled revision makes failure useful and shows whether the chosen change helped."),
  ],
  design: [
    question("Remember", "What creates clear visual hierarchy?", ["Making everything equally loud", "Using size, spacing, contrast, and order to guide attention", "Adding more fonts", "Centering every element"], 1, "Hierarchy helps a viewer understand what matters first and what to do next."),
    question("Apply", "What makes design feedback useful?", ["I do not like it", "A specific observation connected to the user and goal", "Copying a trend", "Changing every element"], 1, "Useful critique names the issue, its effect on the user, and a focused improvement."),
    question("Improve", "A screen feels overwhelming. What is the best first move?", ["Add more cards", "Choose one primary action and reduce competing emphasis", "Use more colors", "Make all text bold"], 1, "One clear priority reduces cognitive load and gives the screen a deliberate hierarchy."),
  ],
  business: [
    question("Apply", "What should a first business test measure?", ["How professional the logo looks", "Whether a specific customer problem exists and the offer helps", "Follower count alone", "How many features are planned"], 1, "Early validation tests the customer problem and whether the proposed value helps."),
    question("Remember", "Which customer feedback is most actionable?", ["That is cool", "A concrete example of the problem, workaround, and desired outcome", "A like", "A copied opinion"], 1, "Specific behavior and context reveal more than general praise."),
    question("Improve", "Several users struggle at the same step. What should you test next?", ["A focused fix to that step", "A new logo", "More unrelated features", "A different audience immediately"], 0, "Repeated friction is evidence. Test the smallest change that addresses it."),
  ],
  communication: [
    question("Remember", "What demonstrates active listening?", ["Planning your reply", "Restating the main point and checking your understanding", "Interrupting quickly", "Agreeing with everything"], 1, "Reflecting the message and checking understanding reduces assumptions."),
    question("Apply", "What makes a message clearer?", ["More jargon", "One purpose, useful context, and a specific next step", "Longer sentences", "Removing every example"], 1, "A clear message tells the audience why it matters and what should happen next."),
    question("Improve", "Someone misunderstands your request. What should you revise?", ["Only repeat it louder", "Clarify the purpose, needed action, and deadline", "Add jargon", "Remove context"], 1, "A concrete action and relevant context make a request easier to follow."),
  ],
  finance: [
    question("Apply", "What is the safest basis for a spending plan?", ["A viral recommendation", "Verified income, essential costs, goals, and a buffer", "Expected future income", "A single good month"], 1, "A useful budget starts with verified numbers and room for uncertainty."),
    question("Remember", "How should a financial claim be checked?", ["Trust confidence", "Check incentives, evidence, fees, risks, and independent sources", "Follow popularity", "Ignore worst-case outcomes"], 1, "Financial decisions require transparent risks, costs, evidence, and independent corroboration."),
    question("Improve", "Your spending plan fails twice in the same category. What is the best response?", ["Hide the spending", "Review the real pattern and set a realistic adjustment", "Borrow to preserve the target", "Stop tracking"], 1, "A plan should adapt to verified behavior while protecting essentials and goals."),
  ],
  wellbeing: [
    question("Remember", "What makes a habit easier to repeat?", ["Relying on motivation", "A small clear action connected to a dependable cue", "Changing the goal daily", "Punishing missed days"], 1, "A small action and reliable cue reduce friction."),
    question("Apply", "What is a healthy response to a missed day?", ["Quit the plan", "Review the barrier, shrink the next step, and restart", "Double every future task", "Hide the result"], 1, "A missed day is feedback; a realistic restart protects consistency."),
    question("Improve", "A routine keeps feeling too hard to start. What should change first?", ["Increase the punishment", "Make the starting action smaller and attach it to a clear cue", "Add three new habits", "Wait for motivation"], 1, "Lowering start-up friction makes repetition more likely."),
  ],
  spirituality: [
    question("Remember", "How should spiritual guidance be evaluated?", ["By popularity alone", "With primary sources, context, trusted community guidance, and personal safety", "By one short clip", "Without questions"], 1, "Primary sources, context, trusted guidance, and safety support thoughtful learning."),
    question("Apply", "What makes a spiritual practice respectful?", ["Claiming one answer fits everyone", "Following consent, humility, context, and the person’s tradition", "Ranking people", "Sharing private beliefs publicly"], 1, "Respectful practice protects personal choice, privacy, tradition, and context."),
    question("Improve", "Two sources interpret a teaching differently. What is the strongest next step?", ["Choose the most viral answer", "Compare context and primary sources, then consult trusted guidance", "Attack one source", "Ignore the difference"], 1, "Context and trusted guidance support careful learning without pretending RISE decides belief."),
  ],
  study: [
    question("Remember", "Which method best checks real understanding?", ["Rereading only", "Explaining from memory and applying the idea to a new example", "Highlighting every line", "Studying longer without breaks"], 1, "Retrieval and transfer show whether knowledge can be recalled and used."),
    question("Apply", "What should happen after a practice mistake?", ["Ignore it", "Identify the cause, correct it, and test the correction", "Start a new subject", "Memorize the answer only"], 1, "Studying the cause and retesting turns a mistake into durable learning."),
    question("Improve", "You recognize notes but cannot answer without them. What should you add?", ["More highlighting", "Closed-book retrieval and a fresh application example", "Longer notes", "Background music"], 1, "Retrieval practice exposes what you can produce independently."),
  ],
};

const clean = (value?: string, fallback = "") => (value || fallback).replace(/\s+/g, " ").trim().slice(0, 180);

function contextualQuestions(context: QuizLearningContext): CycleQuestion[] {
  const title = clean(context.missionTitle);
  const skill = clean(context.focusSkill, "your skill");
  const firstStep = clean(context.missionSteps?.[0]);
  const success = clean(context.successCriteria);
  const result: CycleQuestion[] = [];

  if (title && firstStep) result.push(question("Apply", `For “${title},” which move matches today’s training?`, [firstStep, "Skip the work and mark it complete", "Switch to an unrelated skill", "Wait until the entire skill feels easy"], 0, `Today’s lesson becomes useful when you perform the planned ${skill} move, then inspect the result.`));
  if (success) result.push(question("Prove", `What evidence shows “${title || skill}” is complete?`, ["A completion tap", success, "A motivational quote", "Coins from an earlier mission"], 1, `Use the mission’s finish line: ${success}`));
  if (title) result.push(question("Improve", `After “${title},” what should guide the next attempt?`, ["The weakest part visible in today’s result", "A completely different goal", "The reward amount", "Whatever looks hardest online"], 0, "Your own finished work is the best starting point for one focused adjustment."));
  return result;
}

function domainKeys(value: string): string[] {
  return Array.from(new Set([
    /software|cod(?:e|ing)|developer|programming|react-native|ai-engineer|python|api/.test(value) ? "coding" : "",
    /youtube|creator|marketing|photography|music|content/.test(value) ? "creator" : "",
    /fitness|athlete|basketball|mobility|nutrition/.test(value) ? "fitness" : "",
    /barber/.test(value) ? "barbering" : "",
    /aerospace|mechanical|electrical|civil|(?:^|[\s"\[])engineering/.test(value) ? "engineering" : "",
    /design|artist|photograph|creative|ui|ux/.test(value) ? "design" : "",
    /business|entrepreneur|sales|marketing|leadership|customer/.test(value) ? "business" : "",
    /communicat|public-speaking|writing|relationship/.test(value) ? "communication" : "",
    /finance|money|budget|invest/.test(value) ? "finance" : "",
    /habit|focus|sleep|mindful|wellbeing|personal/.test(value) ? "wellbeing" : "",
    /spirit|faith|religion|god|prayer|scripture/.test(value) ? "spirituality" : "",
    /study|school|student|academic|language|exam/.test(value) ? "study" : "",
  ].filter(Boolean)));
}

export function getCycleQuestions(goal: string, allGoals = goal, context: QuizLearningContext = {}): CycleQuestion[] {
  const value = `${goal} ${allGoals} ${context.focusSkill || ""}`.toLowerCase();
  const keys = domainKeys(value);
  const perDomain = keys.length > 1 ? 2 : 3;
  const specific = keys.flatMap((key) => banks[key]?.slice(0, perDomain) || []);
  const pool = [...contextualQuestions(context), ...specific, ...shared];
  const unique = pool.filter((item, index) => pool.findIndex((candidate) => candidate.question === item.question) === index);
  return unique.slice(0, 7);
}

export function getQuizRank(score: number): QuizRank {
  const safe = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (safe >= 100) return { name: "Ascendant", minimum: 100 };
  if (safe >= 85) return { name: "Vanguard", minimum: 85, nextName: "Ascendant", nextMinimum: 100 };
  if (safe >= 70) return { name: "Pathfinder", minimum: 70, nextName: "Vanguard", nextMinimum: 85 };
  if (safe >= 50) return { name: "Climber", minimum: 50, nextName: "Pathfinder", nextMinimum: 70 };
  return { name: "Foundation", minimum: 0, nextName: "Climber", nextMinimum: 50 };
}
