import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { createSevenDayPlan, loadProfile, PersonalizedMission, RiseProfile } from "../../services/personalization";
import { spiritualResource, spiritualVideoSearch } from "../../services/spiritualResources";
import { RiseButton, RiseCard, RiseEyebrow } from "../../components/rise-ui";
import { getAvailableMissionDay } from "../../services/dayUnlock";
import { missionRepository, MissionRecord } from "../../services/missionRepository";
import { useRiseAppearance } from "../../services/appearance";

export default function LearnTabScreen() {
  const { theme } = useRiseAppearance();
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([loadProfile(), missionRepository.list()]).then(([saved, storedRecords]) => {
      if (!active) return;
      setProfile(saved);
      setRecords(Object.fromEntries(storedRecords.map((record) => [record.missionId, record])));
    });
    return () => { active = false; };
  }, []));

  const plan = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const completedDays = plan.filter((item) => records[item.id]?.status === "completed").map((item) => item.day);
  const mission = plan[getAvailableMissionDay(profile?.skillStartDate, plan.length, completedDays) - 1] || plan[0];
  const guides = useMemo(() => mission ? rankedGuides(mission) : [], [mission]);
  const isSpiritual = Boolean(mission?.sourceNote);
  const faithSource = isSpiritual ? spiritualResource(profile?.spiritualTradition) : undefined;

  const openLearningResource = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("Unsupported URL");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open resource", "Check your connection and try again.");
    }
  };

  if (!profile || !mission) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;

  return <ScrollView style={[styles.page, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <RiseEyebrow>TODAY&apos;S SKILL</RiseEyebrow>
    <Text style={[styles.heading, { color: theme.text }]}>{mission.focusSkill}</Text>
    <Text style={[styles.subtitle, { color: theme.muted }]}>Learn one thing. Use it right away.</Text>

    <RiseCard style={styles.focusCard}>
      <RiseEyebrow>YOUR TARGET</RiseEyebrow>
      <Text style={[styles.focusTitle, { color: theme.text }]}>{mission.title}</Text>
      <Text style={[styles.focusText, { color: theme.muted }]} numberOfLines={2}>{mission.why}</Text>
    </RiseCard>

    <View style={[styles.sequence, { borderColor: theme.border }]}>
      <LearningStep number="1" title="Understand the idea" />
      <LearningStep number="2" title="See one strong example" />
      <LearningStep number="3" title="Use it in today’s mission" last />
    </View>

    <RiseEyebrow>{isSpiritual ? "START WITH YOUR SOURCES" : "TRUSTED STARTING POINTS"}</RiseEyebrow>
    {isSpiritual ? <>
      <RiseCard style={styles.faithContext}><Text style={[styles.faithTitle, { color: theme.text }]}>{faithSource ? `Your ${profile.spiritualTradition} path` : "Your spiritual path"}</Text><Text style={[styles.faithText, { color: theme.muted }]} numberOfLines={2}>{profile.trustedSources?.trim() ? `Start with ${profile.trustedSources.trim()}. ` : "Choose a source meaningful to you. "}{faithSource?.text || "RISE will not choose a belief for you."}</Text></RiseCard>
      {faithSource ? <Pressable accessibilityRole="link" onPress={() => void openLearningResource(faithSource.url)} style={({ pressed }) => [styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]}><View style={styles.guideBody}><Text style={[styles.guideTitle, { color: theme.text }]}>{faithSource.label}</Text><Text style={[styles.guideReason, { color: theme.muted }]}>Open reading library</Text></View><Text style={[styles.guideArrow, { color: theme.accent }]}>Open</Text></Pressable> : null}
    </> : guides.length ? guides.map((guide) => <Pressable key={guide.url} accessibilityRole="link" onPress={() => void openLearningResource(guide.url)} style={({ pressed }) => [styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]}><View style={styles.guideBody}><Text style={[styles.guideTitle, { color: theme.text }]}>{guide.label}</Text><Text style={[styles.guideReason, { color: theme.muted }]} numberOfLines={1}>{guide.reason}</Text></View><Text style={[styles.guideArrow, { color: theme.accent }]}>Open</Text></Pressable>) : <Text style={[styles.sourceCaution, { color: theme.muted }]}>Start with a primary book or qualified teacher you trust.</Text>}
    <View style={styles.actionGap}><RiseButton variant="secondary" label={isSpiritual ? "Find a helpful video" : "Watch and learn"} onPress={() => void openLearningResource(isSpiritual ? spiritualVideoSearch(profile.spiritualTradition, mission.title) : mission.resourceUrl)} /></View>
    <Text style={[styles.sourceCaution, { color: theme.muted }]}>External results are not RISE endorsements. Check the source.</Text>
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.quizButton, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]} onPress={() => router.push({ pathname: "/quiz", params: { skillId: mission.skillId, goal: mission.goal, goals: JSON.stringify(profile.selectedGoals), focusSkill: mission.focusSkill, missionTitle: mission.title, missionSteps: JSON.stringify(mission.steps), successCriteria: mission.successCriteria, reflectionPrompt: mission.reflectionPrompt || "" } } as any)}>
      <View><RiseEyebrow>RISE RANK TRIAL</RiseEyebrow><Text style={[styles.quizTitle, { color: theme.text }]}>Prove what I learned</Text><Text style={[styles.quizHelp, { color: theme.muted }]}>7 focused questions · instant coaching</Text></View><Text style={[styles.quizArrow, { color: theme.accent }]}>→</Text>
    </Pressable>
    <View style={styles.actionGap}><RiseButton label="Start today’s mission" onPress={() => router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any)} /></View>
  </ScrollView>;
}

function rankedGuides(mission: PersonalizedMission) {
  const ranked: { label: string; url: string; reason: string; score: number }[] = [];
  if (mission.guideUrl) ranked.push({ label: mission.guideLabel || "Mission guide", url: mission.guideUrl, reason: "Best topic match from a named teaching or professional source.", score: 100 });
  const context = `${mission.goal} ${mission.skills.join(" ")}`.toLowerCase();
  if (/code|software|developer|react|web/.test(context) && mission.guideUrl !== "https://developer.mozilla.org/en-US/docs/Learn_web_development") ranked.push({ label: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", reason: "Structured beginner lessons from the MDN learning community.", score: 80 });
  if (/fitness|strength|athlet|mobility/.test(context) && mission.guideUrl !== "https://www.acefitness.org/resources/everyone/exercise-library/") ranked.push({ label: "ACE Exercise Library", url: "https://www.acefitness.org/resources/everyone/exercise-library/", reason: "Exercise descriptions and form guidance; adapt to your ability.", score: 80 });
  return ranked.sort((a, b) => b.score - a.score).slice(0, 2);
}

function LearningStep({ number, title, last = false }: { number: string; title: string; last?: boolean }) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.learningStep, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}><View style={[styles.stepNumber, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.stepNumberText, { color: theme.accent }]}>{number}</Text></View><Text style={[styles.stepTitle, { color: theme.text }]}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  loading:{flex:1,alignItems:"center",justifyContent:"center"},page:{flex:1},content:{padding:22,paddingTop:58,paddingBottom:120},
  heading:{fontSize:34,lineHeight:40,fontWeight:"800",letterSpacing:-.7,marginTop:7},subtitle:{fontSize:15,lineHeight:22,marginTop:8,marginBottom:24},
  focusCard:{padding:18,marginBottom:22},focusTitle:{fontSize:19,fontWeight:"800",marginTop:8},focusText:{fontSize:13,lineHeight:19,marginTop:6},
  sequence:{borderTopWidth:1,borderBottomWidth:1,marginBottom:24},learningStep:{minHeight:52,flexDirection:"row",alignItems:"center",gap:12},stepNumber:{width:26,height:26,borderRadius:13,alignItems:"center",justifyContent:"center"},stepNumberText:{fontSize:11,fontWeight:"900"},stepTitle:{fontSize:13,fontWeight:"800"},
  actionGap:{marginTop:12},
  quizButton:{minHeight:82,flexDirection:"row",alignItems:"center",borderRadius:18,borderWidth:1,padding:15,marginTop:6,marginBottom:2},quizTitle:{fontSize:15,fontWeight:"800",marginTop:5},quizHelp:{fontSize:11,marginTop:3},quizArrow:{fontSize:22,fontWeight:"900",marginLeft:"auto"},
  guideCard:{minHeight:70,flexDirection:"row",alignItems:"center",borderRadius:14,borderWidth:1,padding:13,marginTop:11,marginBottom:9},guideBody:{flex:1},guideTitle:{fontSize:13,fontWeight:"800"},guideReason:{fontSize:11,lineHeight:17,marginTop:3},guideArrow:{fontSize:11,fontWeight:"900",marginLeft:8},sourceCaution:{fontSize:11,lineHeight:17,marginTop:8,marginBottom:10},
  faithContext:{padding:15,marginTop:11,marginBottom:12},faithTitle:{fontSize:13,fontWeight:"900"},faithText:{fontSize:12,lineHeight:19,marginTop:6},
});
