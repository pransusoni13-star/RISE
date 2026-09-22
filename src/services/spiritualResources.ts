// These are optional starting points, not endorsements or claims that a single
// text, translation, or teacher represents everyone in a tradition.
const sources: Record<string, { label: string; url: string; text: string; search: string }> = {
  Christianity: {
    label: "Read the Bible · Bible Gateway",
    url: "https://www.biblegateway.com/",
    text: "Choose the Bible translation and passage used by your community.",
    search: "Christian Bible passage study",
  },
  Islam: {
    label: "Read the Qur’an · Quran.com",
    url: "https://quran.com/",
    text: "Read a short passage with the translation and context you trust.",
    search: "Quran surah study context",
  },
  Judaism: {
    label: "Read the Tanakh · Sefaria",
    url: "https://www.sefaria.org/texts/Tanakh",
    text: "Choose a passage, translation, and commentary meaningful to your community.",
    search: "Jewish Tanakh passage study",
  },
  Hinduism: {
    label: "Explore primary texts · IIT Kanpur Gita Supersite",
    url: "https://www.gitasupersite.iitk.ac.in/",
    text: "Start with a text and interpretation used in your own tradition; this library is one option.",
    search: "Hindu primary text Bhagavad Gita study",
  },
  Buddhism: {
    label: "Explore early Buddhist texts · SuttaCentral",
    url: "https://suttacentral.net/introduction",
    text: "This library focuses on early Buddhist texts, not every Buddhist school.",
    search: "Buddhist sutta study primary text",
  },
  Sikhism: {
    label: "Read Sri Guru Granth Sahib · SriGranth",
    url: "https://www.srigranth.org/",
    text: "Read with the language, translation, and community guidance you trust.",
    search: "Sikh Gurbani Sri Guru Granth Sahib study",
  },
};

export function spiritualResource(tradition?: string) {
  return tradition ? sources[tradition] : undefined;
}

export function spiritualVideoSearch(tradition: string | undefined, missionTitle: string) {
  const source = spiritualResource(tradition);
  const terms = `${source?.search || "spiritual primary text"} ${missionTitle} full lesson -shorts`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(terms)}`;
}

export function spiritualPractice(day: number, personalAnchor?: string) {
  const anchor = personalAnchor?.trim() || "a source or practice meaningful to you";
  const prompts = [
    `Write one small way ${anchor} could shape your daily actions.`,
    `Read a short passage or teaching connected to ${anchor}; note its context and one question.`,
    `Spend a few quiet minutes in a practice connected to ${anchor}, then write what you noticed.`,
    `Ask one sincere question about ${anchor} and seek context from a trusted primary source or teacher.`,
    `Choose one value connected to ${anchor} and put it into one kind, concrete action.`,
    `Ask a trusted community or teacher how they understand ${anchor}; you can keep your question private.`,
    `Review what you learned about ${anchor} this cycle and choose one gentle next step.`,
  ];
  return prompts[(Math.max(1, day) - 1) % prompts.length];
}
