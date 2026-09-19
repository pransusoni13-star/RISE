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
};

export function getCycleQuestions(goal: string): CycleQuestion[] {
  const value = goal.toLowerCase();
  const keys = [
    /software|code|developer|ai-engineer/.test(value) ? "coding" : "",
    /youtube|creator|marketing|photography|music/.test(value) ? "creator" : "",
    /fitness|athlete|basketball|mobility|nutrition|wellbeing/.test(value) ? "fitness" : "",
    /barber/.test(value) ? "barbering" : "",
    /engineer|aerospace/.test(value) ? "engineering" : "",
  ].filter(Boolean);
  const specific = Array.from(new Set(keys)).flatMap((key) => banks[key]?.slice(0, 1) || []);
  return [...shared, ...(specific.length ? specific : [
    { question: "What should your next cycle change?", options: ["Everything", "The single highest-value weakness shown by your proof", "Nothing", "Only the reward"], answer: 1, explanation: "One evidence-based adjustment keeps improvement focused." },
    { question: "What belongs in a strong reflection?", options: ["What you did, learned, and will improve", "Only that it was completed", "A copied definition", "Private information"], answer: 0, explanation: "A useful reflection connects action, learning, and the next adjustment." },
  ])].slice(0, 5);
}
