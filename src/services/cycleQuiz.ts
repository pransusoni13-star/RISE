export type CycleQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

const shared: CycleQuestion[] = [
  { question: "What best proves improvement?", options: ["A button tap", "A visible result compared with a clear goal", "Time passing", "A motivational quote"], answer: 1, explanation: "Useful proof connects visible work to a clear success target." },
  { question: "What makes practice effective?", options: ["Changing everything at once", "Repeating without review", "Focusing on one weakness, getting feedback, and adjusting", "Avoiding mistakes"], answer: 2, explanation: "Focused practice uses feedback to improve one specific part." },
  { question: "How should a reliable source be used?", options: ["Trust the first result", "Check expertise, evidence, context, and other strong sources", "Follow the most popular creator", "Ignore the publication date"], answer: 1, explanation: "Authority, evidence, context, and corroboration are stronger than popularity." },
];

const banks: Record<string, CycleQuestion[]> = {
  coding: [
    { question: "What is the strongest way to test a feature?", options: ["Only read the code", "Test the main flow and a likely failure case", "Assume it works after compiling", "Change multiple features first"], answer: 1, explanation: "A useful test covers success and a realistic failure state." },
    { question: "Why use TypeScript types?", options: ["To replace testing", "To describe expected data and catch mistakes earlier", "To make every file longer", "To publish automatically"], answer: 1, explanation: "Types document expected shapes and catch many errors before runtime." },
  ],
  creator: [
    { question: "A strong opening should do what first?", options: ["Ask for a subscription", "Deliver on the title and thumbnail promise", "Use a long logo animation", "Explain the creator's history"], answer: 1, explanation: "The opening should quickly confirm the value promised to the viewer." },
    { question: "Which metric helps diagnose whether viewers keep watching?", options: ["File size", "Audience retention", "Upload filename", "Camera model"], answer: 1, explanation: "Audience retention shows where viewers stay or leave." },
  ],
  fitness: [
    { question: "What is a safe progression?", options: ["Increase everything at once", "Add a manageable challenge while maintaining form and recovery", "Train through sharp pain", "Copy an advanced plan exactly"], answer: 1, explanation: "Progress should be gradual and preserve safe technique and recovery." },
    { question: "When should a session stop?", options: ["Sharp pain, dizziness, or unusual symptoms", "When form is controlled", "After a warm-up", "When the plan is personalized"], answer: 0, explanation: "Pain, dizziness, or unusual symptoms are reasons to stop and seek appropriate guidance." },
  ],
  barbering: [
    { question: "What comes before using tools on another person?", options: ["Taking a photo", "Consent, consultation, sanitation, and a safe plan", "Choosing a filter", "Working as quickly as possible"], answer: 1, explanation: "Consent, consultation, and sanitation protect both client and barber." },
    { question: "How should a visible guideline be corrected?", options: ["Use controlled corner work and small guard changes", "Push the fade much higher", "Press harder", "Ignore the transition"], answer: 0, explanation: "Small, controlled changes reduce the risk of creating another line." },
  ],
  engineering: [
    { question: "What makes an engineering test useful?", options: ["Changing conditions during the test", "One clear metric and repeatable conditions", "No written result", "Testing the final product only"], answer: 1, explanation: "Repeatable conditions and a clear metric make results comparable." },
    { question: "Why build a small prototype?", options: ["To prove every assumption", "To test the riskiest assumption early", "To avoid user needs", "To skip safety review"], answer: 1, explanation: "A small prototype cheaply tests the core uncertainty." },
  ],
  design: [
    { question: "What creates clear visual hierarchy?", options: ["Making everything equally loud", "Using size, spacing, contrast, and order to guide attention", "Adding more fonts", "Centering every element"], answer: 1, explanation: "Hierarchy helps a viewer understand what matters first and what to do next." },
    { question: "What makes design feedback useful?", options: ["I do not like it", "A specific observation connected to the user and goal", "Copying a trend", "Changing every element"], answer: 1, explanation: "Useful critique names a specific issue, its effect on the user, and a possible improvement." },
  ],
  business: [
    { question: "What should a first business test measure?", options: ["How professional the logo looks", "Whether a specific customer problem exists and the offer helps", "Follower count alone", "How many features are planned"], answer: 1, explanation: "Early validation should test the customer problem and whether the proposed value actually helps." },
    { question: "Which customer feedback is most actionable?", options: ["That is cool", "A concrete example of the problem, current workaround, and desired outcome", "A like", "A copied opinion"], answer: 1, explanation: "Specific behavior and context reveal more than general praise or interest." },
  ],
  communication: [
    { question: "What demonstrates active listening?", options: ["Planning your reply", "Restating the main point and checking that you understood", "Interrupting quickly", "Agreeing with everything"], answer: 1, explanation: "Reflecting the message and checking understanding reduces assumptions and shows attention." },
    { question: "What makes a message clearer?", options: ["More jargon", "One purpose, useful context, and a specific next step", "Longer sentences", "Removing all examples"], answer: 1, explanation: "A clear message tells the audience why it matters and what should happen next." },
  ],
  finance: [
    { question: "What is the safest basis for a personal spending plan?", options: ["A viral recommendation", "Verified income, essential costs, goals, and a buffer", "Expected future income", "A single good month"], answer: 1, explanation: "A useful budget starts with verified numbers and leaves room for uncertainty." },
    { question: "How should a financial claim be checked?", options: ["Trust confidence", "Check incentives, evidence, fees, risks, and independent sources", "Follow popularity", "Ignore worst-case outcomes"], answer: 1, explanation: "Financial decisions require transparent risks, costs, evidence, and independent corroboration." },
  ],
  wellbeing: [
    { question: "What makes a habit easier to repeat?", options: ["Relying on motivation", "A small clear action connected to a dependable cue", "Changing the goal daily", "Punishing missed days"], answer: 1, explanation: "A small action and reliable cue reduce friction and make repetition more likely." },
    { question: "What is a healthy response to a missed day?", options: ["Quit the plan", "Review the barrier, shrink the next step, and restart", "Double every future task", "Hide the result"], answer: 1, explanation: "A missed day is useful feedback; restarting with a realistic adjustment protects consistency." },
  ],
  spirituality: [
    { question: "How should spiritual guidance be evaluated?", options: ["By popularity alone", "With primary sources, context, trusted community guidance, and personal safety", "By one short clip", "Without questions"], answer: 1, explanation: "Primary sources, context, trusted guidance, and safety support thoughtful spiritual learning." },
    { question: "What makes a spiritual practice respectful?", options: ["Claiming one answer fits everyone", "Following consent, humility, context, and the person’s own tradition", "Ranking people", "Sharing private beliefs publicly"], answer: 1, explanation: "Respectful practice protects personal choice, privacy, tradition, and context." },
  ],
  study: [
    { question: "Which method best checks real understanding?", options: ["Rereading only", "Explaining from memory and applying the idea to a new example", "Highlighting every line", "Studying longer without breaks"], answer: 1, explanation: "Retrieval and transfer show whether knowledge can be recalled and used." },
    { question: "What should happen after a practice mistake?", options: ["Ignore it", "Identify the cause, correct it, and test the correction", "Start a new subject", "Memorize the answer only"], answer: 1, explanation: "Studying the cause and retesting turns a mistake into durable learning." },
  ],
};

export function getCycleQuestions(goal: string, allGoals = goal): CycleQuestion[] {
  const value = allGoals.toLowerCase();
  const focus = goal.replace(/[-_]/g, " ").trim().slice(0, 48) || "your skill";
  const keys = [
    /software|cod(?:e|ing)|developer|programming|react-native|ai-engineer/.test(value) ? "coding" : "",
    /youtube|creator|marketing|photography|music/.test(value) ? "creator" : "",
    /fitness|athlete|basketball|mobility|nutrition|wellbeing/.test(value) ? "fitness" : "",
    /barber/.test(value) ? "barbering" : "",
    /aerospace|mechanical|electrical|civil|(?:^|[\s"\[])engineering/.test(value) ? "engineering" : "",
    /design|artist|photograph|creative|ui|ux/.test(value) ? "design" : "",
    /business|entrepreneur|sales|marketing|leadership/.test(value) ? "business" : "",
    /communicat|public-speaking|writing|relationship/.test(value) ? "communication" : "",
    /finance|money|budget|invest/.test(value) ? "finance" : "",
    /habit|focus|sleep|mindful|wellbeing|personal/.test(value) ? "wellbeing" : "",
    /spirit|faith|religion|god|prayer|scripture/.test(value) ? "spirituality" : "",
    /study|school|student|academic|language|exam/.test(value) ? "study" : "",
  ].filter(Boolean);
  const uniqueKeys = Array.from(new Set(keys));
  const specific = uniqueKeys.flatMap((key) => banks[key]?.slice(0, uniqueKeys.length > 1 ? 1 : 2) || []);
  return [{
    question: `For ${focus}, what best shows that you improved?`,
    options: ["Only saying I tried", "A result I can compare with my starting point", "Doing a different task", "Getting more coins"],
    answer: 1,
    explanation: "Compare a real result with your starting point. That shows what changed and what to practice next.",
  }, ...shared.slice(1), ...(specific.length ? specific : [
    { question: "What should your next cycle change?", options: ["Everything", "The single highest-value weakness shown by your proof", "Nothing", "Only the reward"], answer: 1, explanation: "One evidence-based adjustment keeps improvement focused." },
    { question: "What belongs in a strong reflection?", options: ["What you did, learned, and will improve", "Only that it was completed", "A copied definition", "Private information"], answer: 0, explanation: "A useful reflection connects action, learning, and the next adjustment." },
  ])].slice(0, 5);
}
