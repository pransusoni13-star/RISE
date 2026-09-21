import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  addSkillXP,
  addXP,
  RISEProgress,
} from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";

type Difficulty = "Easy" | "Medium" | "Hard" | "Insane";

type Project = {
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  requirements: string[];
  proof: string[];
  reward: number;
  skillId: string;
};

const STORAGE_KEY = "RISE_SELECTED_GOALS";

const goalLabels: Record<string, string> = {
  coding: "Coding",
  business: "Business",
  finance: "Finance",
  engineering: "Engineering",
  education: "Education",
  fitness: "Fitness",
  medicine: "Medicine",
  law: "Law",
  science: "Science",
  math: "Math",
  writing: "Writing",
  art: "Art",
  music: "Music",
  sports: "Sports",
  leadership: "Leadership",
  entrepreneurship: "Entrepreneurship",
  marketing: "Marketing",
  psychology: "Psychology",
  social: "Social Sciences",
  architecture: "Architecture",
  environment: "Environment",
  languages: "Languages",
  personal: "Personal Growth",
  productivity: "Productivity",
  creativity: "Creativity",
};

const buildGoalProjectSet = (goal: string): Record<Difficulty, Project> => {
  const goalLabel = goalLabels[goal] ||
    goal
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const goalPhrase = goalLabel.toLowerCase();
  const focusSkill = goalLabel === "Coding" ? "Programming" : goalLabel;

  return {
    Easy: {
      title: `${goalLabel} Starter Challenge`,
      description: `Pick one small, meaningful ${goalPhrase} problem and turn it into a visible result you can explain clearly.`,
      skills: [focusSkill, "Problem Solving", "Research"],
      estimatedTime: "1 hour",
      requirements: [
        `Choose a real ${goalPhrase} problem`,
        "Define a simple success metric",
        "Create a useful result",
        "Explain what you learned",
      ],
      proof: ["Result", "Short explanation", "Screenshots or notes"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: `Build a Useful ${goalLabel} Project`,
      description: `Create something practical in ${goalPhrase} that demonstrates real skill, not just theory.`,
      skills: [focusSkill, "Execution", "Practical Skills"],
      estimatedTime: "2–4 hours",
      requirements: [
        "Identify a concrete need",
        "Design a solution",
        "Build it carefully",
        "Test it with real feedback",
      ],
      proof: ["Working result", "Screenshots", "Reflection"],
      reward: 150,
      skillId: "practical-skills",
    },
    Hard: {
      title: `Ship a ${goalLabel} Outcome`,
      description: `Turn a real ${goalPhrase} idea into a polished outcome that others can understand and use.`,
      skills: [focusSkill, "Execution", "Projects"],
      estimatedTime: "5–10 hours",
      requirements: [
        "Research the problem deeply",
        "Design a strong solution",
        "Build the full version",
        "Improve it based on testing",
      ],
      proof: ["Final outcome", "Testing", "Reflection"],
      reward: 300,
      skillId: "projects",
    },
    Insane: {
      title: `Create Real-World ${goalLabel} Impact`,
      description: `Solve a meaningful ${goalPhrase} problem and prove your solution works in a real scenario.`,
      skills: [focusSkill, "Strategy", "Execution"],
      estimatedTime: "10+ hours",
      requirements: [
        "Find a meaningful problem",
        "Build a thoughtful solution",
        "Get real feedback or users",
        "Measure the result",
        "Improve the outcome",
      ],
      proof: ["Working solution", "Users or feedback", "Results", "Demo"],
      reward: 500,
      skillId: "advanced",
    },
  };
};

const projectLibrary: Record<string, Record<Difficulty, Project>> = {
  coding: {
    Easy: {
      title: "Build a Personal Calculator",
      description:
        "Create a calculator that performs useful calculations through a simple interface.",
      skills: ["Programming", "Logic", "Problem Solving"],
      estimatedTime: "1–2 hours",
      requirements: [
        "Choose a programming language",
        "Build the calculator logic",
        "Handle incorrect input",
        "Test multiple calculations",
      ],
      proof: ["Screenshot", "Code", "Short explanation"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Build a Weather App",
      description:
        "Build an app that gets weather information and presents it clearly.",
      skills: ["APIs", "Programming", "UI"],
      estimatedTime: "3–5 hours",
      requirements: [
        "Find a weather API",
        "Connect your application",
        "Display weather data",
        "Handle loading and errors",
      ],
      proof: ["Working app", "Screenshot", "Code"],
      reward: 100,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Build a Full-Stack Task App",
      description:
        "Create an application where users can create, edit, complete, and delete tasks.",
      skills: ["Frontend", "Backend", "Database"],
      estimatedTime: "6–10 hours",
      requirements: [
        "Create the frontend",
        "Create the backend",
        "Connect a database",
        "Implement CRUD operations",
      ],
      proof: ["Working application", "Code", "Demo"],
      reward: 250,
      skillId: "projects",
    },
    Insane: {
      title: "Build an AI-Powered Application",
      description:
        "Build a useful application that uses AI to solve a real problem.",
      skills: ["AI", "Software Engineering", "Product Design"],
      estimatedTime: "10+ hours",
      requirements: [
        "Identify a real problem",
        "Design the solution",
        "Integrate an AI model",
        "Build the application",
        "Test it with real users",
      ],
      proof: ["Working application", "Demo", "User feedback", "Code"],
      reward: 500,
      skillId: "advanced",
    },
  },

  business: {
    Easy: {
      title: "Find a Real Business Problem",
      description:
        "Study a real business and identify a problem that could be solved.",
      skills: ["Research", "Business Analysis", "Problem Solving"],
      estimatedTime: "30–60 minutes",
      requirements: [
        "Choose a real business",
        "Study its website and social media",
        "Identify one important problem",
        "Explain why the problem matters",
      ],
      proof: ["Written analysis", "Screenshots"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Create a Business Landing Page",
      description:
        "Design and build a landing page that solves a real business need.",
      skills: ["Marketing", "Design", "Business"],
      estimatedTime: "2–4 hours",
      requirements: [
        "Choose a business",
        "Identify its target customer",
        "Create the offer",
        "Build the landing page",
      ],
      proof: ["Website", "Screenshots", "Explanation"],
      reward: 100,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Launch a Mini Business",
      description:
        "Create a small real-world business experiment and try to get your first customer.",
      skills: ["Entrepreneurship", "Marketing", "Sales"],
      estimatedTime: "1–2 weeks",
      requirements: [
        "Choose a problem",
        "Create an offer",
        "Find potential customers",
        "Reach out to customers",
        "Track your results",
      ],
      proof: ["Offer", "Outreach", "Results", "Reflection"],
      reward: 250,
      skillId: "projects",
    },
    Insane: {
      title: "Build and Validate a Startup",
      description:
        "Take a real problem from idea to tested product.",
      skills: ["Entrepreneurship", "Product", "Sales", "Strategy"],
      estimatedTime: "2–4 weeks",
      requirements: [
        "Find a real problem",
        "Interview potential users",
        "Build an MVP",
        "Get real users",
        "Measure results",
      ],
      proof: ["MVP", "User feedback", "Metrics", "Demo"],
      reward: 500,
      skillId: "advanced",
    },
  },

  finance: {
    Easy: {
      title: "Analyze One Company",
      description:
        "Research a public company and explain how the business makes money.",
      skills: ["Research", "Financial Analysis"],
      estimatedTime: "1 hour",
      requirements: [
        "Choose a company",
        "Understand its products",
        "Find its revenue",
        "Explain its competitive advantage",
      ],
      proof: ["Company analysis", "Sources"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Build a Stock Analyzer",
      description:
        "Create a tool that compares important financial metrics.",
      skills: ["Finance", "Data Analysis", "Programming"],
      estimatedTime: "3–5 hours",
      requirements: [
        "Choose financial metrics",
        "Collect company data",
        "Build calculations",
        "Create a useful interface",
      ],
      proof: ["Working tool", "Screenshots", "Analysis"],
      reward: 175,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Create an Investment Thesis",
      description:
        "Create a detailed investment thesis for a public company.",
      skills: ["Valuation", "Research", "Critical Thinking"],
      estimatedTime: "4–6 hours",
      requirements: [
        "Research the company",
        "Study financial statements",
        "Analyze risks",
        "Estimate future potential",
        "Write your thesis",
      ],
      proof: ["Investment thesis", "Research", "Calculations"],
      reward: 250,
      skillId: "projects",
    },
    Insane: {
      title: "Build a Financial Freedom Simulator",
      description:
        "Build a model that shows how savings, investing, income, and time interact.",
      skills: ["Finance", "Programming", "Modeling"],
      estimatedTime: "8–15 hours",
      requirements: [
        "Create financial assumptions",
        "Build the calculations",
        "Create scenarios",
        "Build an interface",
        "Test the model",
      ],
      proof: ["Working simulator", "Code", "Demo"],
      reward: 500,
      skillId: "advanced",
    },
  },

  engineering: {
    Easy: {
      title: "Design a Simple Product",
      description:
        "Identify a small problem and design a physical product that could solve it.",
      skills: ["CAD", "Design Thinking", "Engineering"],
      estimatedTime: "1–2 hours",
      requirements: [
        "Identify a problem",
        "Sketch a solution",
        "Create a CAD model",
        "Explain your design choices",
      ],
      proof: ["CAD model", "Sketch", "Explanation"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Build a Prototype",
      description:
        "Turn a product idea into a physical prototype.",
      skills: ["CAD", "Prototyping", "Problem Solving"],
      estimatedTime: "3–6 hours",
      requirements: [
        "Design the product",
        "Choose materials",
        "Build a prototype",
        "Test it",
      ],
      proof: ["Prototype", "Photos", "Testing results"],
      reward: 150,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Engineer a Functional System",
      description:
        "Design and build a system that performs a useful real-world function.",
      skills: ["Engineering", "Electronics", "Design"],
      estimatedTime: "8–15 hours",
      requirements: [
        "Define requirements",
        "Design the system",
        "Build the prototype",
        "Test and improve it",
      ],
      proof: ["Prototype", "CAD", "Testing"],
      reward: 300,
      skillId: "projects",
    },
    Insane: {
      title: "Build an Autonomous Engineering System",
      description:
        "Create a system that can sense, decide, and perform actions automatically.",
      skills: ["Engineering", "Programming", "Electronics", "Control"],
      estimatedTime: "15+ hours",
      requirements: [
        "Define the problem",
        "Design the system",
        "Build the hardware",
        "Program the system",
        "Test autonomous behavior",
      ],
      proof: ["Working system", "Video", "CAD", "Code"],
      reward: 500,
      skillId: "advanced",
    },
  },

  education: {
    Easy: {
      title: "Teach Something You Learned",
      description:
        "Take a topic you understand and teach it clearly to someone else.",
      skills: ["Communication", "Understanding", "Teaching"],
      estimatedTime: "30–60 minutes",
      requirements: [
        "Choose a topic",
        "Explain it simply",
        "Create an example",
        "Teach someone",
      ],
      proof: ["Explanation", "Study material"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Create a Study Guide",
      description:
        "Create a high-quality study guide that helps someone master a topic.",
      skills: ["Research", "Teaching", "Organization"],
      estimatedTime: "1–3 hours",
      requirements: [
        "Research the topic",
        "Organize the concepts",
        "Create examples",
        "Create practice questions",
      ],
      proof: ["Study guide", "Questions"],
      reward: 100,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Build a Learning Resource",
      description:
        "Create an interactive resource that teaches a topic.",
      skills: ["Teaching", "Design", "Communication"],
      estimatedTime: "4–8 hours",
      requirements: [
        "Choose a topic",
        "Design the learning experience",
        "Create explanations",
        "Add practice",
        "Test with a learner",
      ],
      proof: ["Learning resource", "Feedback"],
      reward: 250,
      skillId: "projects",
    },
    Insane: {
      title: "Build a Mini Learning Platform",
      description:
        "Create a small platform that helps people learn a real skill.",
      skills: ["Education", "Technology", "Product"],
      estimatedTime: "10+ hours",
      requirements: [
        "Choose a learning problem",
        "Design the curriculum",
        "Build the platform",
        "Test with learners",
        "Improve based on feedback",
      ],
      proof: ["Platform", "Demo", "Learner feedback"],
      reward: 500,
      skillId: "advanced",
    },
  },

  default: {
    Easy: {
      title: "Solve a Real Problem",
      description:
        "Identify a real problem connected to your goal and create a simple solution.",
      skills: ["Problem Solving", "Research"],
      estimatedTime: "1 hour",
      requirements: [
        "Find a real problem",
        "Understand why it exists",
        "Create a solution",
        "Explain your reasoning",
      ],
      proof: ["Solution", "Explanation"],
      reward: 50,
      skillId: "foundations",
    },
    Medium: {
      title: "Build Something Useful",
      description:
        "Create something that solves a real problem.",
      skills: ["Problem Solving", "Practical Skills"],
      estimatedTime: "2–4 hours",
      requirements: [
        "Identify a problem",
        "Design a solution",
        "Build it",
        "Test it",
      ],
      proof: ["Working solution", "Testing"],
      reward: 150,
      skillId: "practical-skills",
    },
    Hard: {
      title: "Build a Complete Solution",
      description:
        "Take a real problem from research through implementation.",
      skills: ["Problem Solving", "Execution", "Projects"],
      estimatedTime: "5–10 hours",
      requirements: [
        "Research the problem",
        "Design the solution",
        "Build it",
        "Test it",
        "Improve it",
      ],
      proof: ["Final solution", "Testing", "Reflection"],
      reward: 300,
      skillId: "projects",
    },
    Insane: {
      title: "Create Real-World Impact",
      description:
        "Solve a meaningful real-world problem and prove that your solution works.",
      skills: ["Strategy", "Execution", "Problem Solving"],
      estimatedTime: "10+ hours",
      requirements: [
        "Find a meaningful problem",
        "Build a solution",
        "Get real users",
        "Measure the results",
        "Improve the solution",
      ],
      proof: ["Working solution", "Users", "Results"],
      reward: 500,
      skillId: "advanced",
    },
  },
};

export default function ProjectScreen() {
  const params = useLocalSearchParams();
  const [storedGoals, setStoredGoals] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      if (params.goals) {
        return;
      }

      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved || !isMounted) {
          return;
        }

        const parsedGoals = JSON.parse(saved) as string[];
        setStoredGoals(Array.isArray(parsedGoals) ? parsedGoals : []);
      } catch (error) {
        console.log("Could not load selected goals:", error);
      }
    };

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, [params.goals]);

  const goals = params.goals
    ? JSON.parse(String(params.goals))
    : storedGoals.length
      ? storedGoals
      : ["coding"];

  const primaryGoal = String(goals[0] || "coding").toLowerCase();

  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [reflection, setReflection] = useState("");
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const project = useMemo(() => {
    const library =
      projectLibrary[primaryGoal] ||
      buildGoalProjectSet(primaryGoal);

    return library[difficulty];
  }, [primaryGoal, difficulty]);

  const completeProject = async () => {
    if (reflection.trim().length < 20) {
      return;
    }

    try {
      let progress: RISEProgress = await progressRepository.load();

      progress = addXP(
        progress,
        project.reward,
        "project",
        `Completed Project: ${project.title}`,
        Math.max(15, Math.round(project.reward / 4))
      );

      progress = addSkillXP(
        progress,
        project.skillId,
        project.reward
      );

      await progressRepository.save(progress);

      setEarnedXP(project.reward);
      setCompleted(true);
    } catch (error) {
      console.log("Could not save project progress:", error);
    }
  };

  if (completed) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🚀</Text>

        <Text style={styles.successTitle}>
          Project Complete
        </Text>

        <Text style={styles.successSubtitle}>
          You didn’t just learn something.
          {"\n"}
          You built something.
        </Text>

        <View style={styles.xpCard}>
          <Text style={styles.xpLabel}>XP EARNED</Text>
          <Text style={styles.xpValue}>+{earnedXP} XP</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/progress-screen",
            } as any)
          }
        >
          <Text style={styles.primaryButtonText}>
            View My Progress
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: "/proof",
              params: {
                task: project.title,
                reward: String(project.reward),
              },
            } as any)
          }
        >
          <Text style={styles.secondaryButtonText}>
            Prove It
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.brand}>RISE PROJECT ENGINE</Text>

        <Text style={styles.heading}>
          Build something real.
        </Text>

        <Text style={styles.subtitle}>
          RISE turns what you’re learning into a real-world
          project you can actually show.
        </Text>

        <Text style={styles.sectionTitle}>
          Choose your difficulty
        </Text>

        <View style={styles.difficultyRow}>
          {(["Easy", "Medium", "Hard", "Insane"] as Difficulty[]).map(
            (level) => (
              <Pressable
                key={level}
                onPress={() => setDifficulty(level)}
                style={[
                  styles.difficultyButton,
                  difficulty === level &&
                    styles.difficultyButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === level &&
                      styles.difficultyTextActive,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <View style={styles.projectCard}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {difficulty.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.reward}>
              +{project.reward} XP
            </Text>
          </View>

          <Text style={styles.projectTitle}>
            {project.title}
          </Text>

          <Text style={styles.projectDescription}>
            {project.description}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TIME</Text>
            <Text style={styles.infoValue}>
              {project.estimatedTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKILLS</Text>
            <Text style={styles.infoValue}>
              {project.skills.join(" • ")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Project requirements
        </Text>

        {project.requirements.map((requirement, index) => (
          <View style={styles.requirement} key={requirement}>
            <View style={styles.number}>
              <Text style={styles.numberText}>
                {index + 1}
              </Text>
            </View>

            <Text style={styles.requirementText}>
              {requirement}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          What counts as proof?
        </Text>

        <View style={styles.proofCard}>
          {project.proof.map((item) => (
            <Text style={styles.proofItem} key={item}>
              ✓ {item}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          What did you actually learn?
        </Text>

        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="Write at least 20 characters about what you learned..."
          placeholderTextColor="#999999"
          multiline
          maxLength={1200}
          style={styles.input}
        />

        <Text style={styles.characterCount}>
          {reflection.length}/20 minimum characters
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={completeProject}
          disabled={reflection.trim().length < 20}
          style={[
            styles.completeButton,
            reflection.trim().length < 20 &&
              styles.completeButtonDisabled,
          ]}
        >
          <Text style={styles.completeButtonText}>
            Complete Project • +{project.reward} XP
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#010807",
  },

  container: {
    flex: 1,
    backgroundColor: "#010807",
  },

  content: {
    padding: 24,
    paddingTop: 65,
    paddingBottom: 130,
  },

  brand: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#7AF5B8",
    marginBottom: 12,
  },

  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: "#F5FFF9",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#C8EED9",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F5FFF9",
    marginBottom: 14,
    marginTop: 8,
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },

  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#071B16",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  difficultyButtonActive: {
    backgroundColor: "#7AF5B8",
  },

  difficultyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5FFF9",
  },

  difficultyTextActive: {
    color: "#010807",
  },

  projectCard: {
    backgroundColor: "#071B16",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.18)",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  badge: {
    backgroundColor: "#7AF5B8",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeText: {
    color: "#010807",
    fontSize: 11,
    fontWeight: "800",
  },

  reward: {
    color: "#8EF0B9",
    fontSize: 16,
    fontWeight: "800",
  },

  projectTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 10,
  },

  projectDescription: {
    color: "#CCCCCC",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },

  infoRow: {
    borderTopWidth: 1,
    borderTopColor: "#292929",
    paddingTop: 13,
    marginTop: 13,
  },

  infoLabel: {
    color: "#B4D4C2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  number: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F7EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  numberText: {
    color: "#19A463",
    fontWeight: "800",
  },

  requirementText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: "#F5FFF9",
  },

  proofCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.18)",
  },

  proofItem: {
    fontSize: 15,
    color: "#C8EED9",
    fontWeight: "600",
    marginBottom: 9,
  },

  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#1E3A31",
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    color: "#F5FFF9",
    backgroundColor: "#071B16",
    textAlignVertical: "top",
    marginBottom: 8,
  },

  characterCount: {
    color: "#B4D4C2",
    fontSize: 12,
    marginBottom: 18,
  },

  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
  },

  completeButton: {
    backgroundColor: "#19A463",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#19A463",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  completeButtonDisabled: {
    backgroundColor: "#BBBBBB",
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  backButton: {
    paddingVertical: 20,
    alignItems: "center",
  },

  backButtonText: {
    color: "#7AF5B8",
    fontSize: 15,
    fontWeight: "700",
  },

  successContainer: {
    flex: 1,
    backgroundColor: "#010807",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },

  successEmoji: {
    fontSize: 55,
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#F5FFF9",
    textAlign: "center",
    marginBottom: 12,
  },

  successSubtitle: {
    fontSize: 17,
    lineHeight: 25,
    color: "#C8EED9",
    textAlign: "center",
    marginBottom: 30,
  },

  xpCard: {
    width: "100%",
    backgroundColor: "#0D2F22",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  xpLabel: {
    color: "#19A463",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },

  xpValue: {
    color: "#F5FFF9",
    fontSize: 36,
    fontWeight: "900",
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#7AF5B8",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#010807",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#7AF5B8",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#7AF5B8",
    fontSize: 16,
    fontWeight: "800",
  },
});
