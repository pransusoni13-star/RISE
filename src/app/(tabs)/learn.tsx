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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showMoreLearning, setShowMoreLearning] = useState(false);

  useFocusEffect(useCallback(() => {
    // A changed key represents an explicit retry and intentionally restarts this load.
    void reloadKey;
    let active = true;
    setLoadError("");
    void Promise.all([loadProfile(), missionRepository.list()]).then(([saved, storedRecords]) => {
      if (!active) return;
      setProfile(saved);
      setRecords(Object.fromEntries(storedRecords.map((record) => [record.missionId, record])));
    }).catch(() => {
      if (active) setLoadError("RISE could not open today’s lesson. Your saved work has not been changed.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]));

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

  if (loading) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /><Text style={[styles.loadingText, { color: theme.muted }]}>Opening today’s lesson…</Text></View>;
  if (loadError) return <View style={[styles.loading, { backgroundColor: theme.background }]}><Text style={[styles.stateTitle, { color: theme.text }]}>Your lesson is still safe.</Text><Text style={[styles.loadingText, { color: theme.muted }]}>{loadError}</Text><View style={styles.stateAction}><RiseButton label="Try again" onPress={() => { setLoading(true); setReloadKey((value) => value + 1); }} /></View></View>;
  if (!profile || !mission) return <View style={[styles.loading, { backgroundColor: theme.background }]}><Text style={[styles.stateTitle, { color: theme.text }]}>Build a plan first.</Text><Text style={[styles.loadingText, { color: theme.muted }]}>Choose one direction so RISE can prepare a focused lesson.</Text><View style={styles.stateAction}><RiseButton label="Build my plan" onPress={() => router.replace("/popular-skills" as never)} /></View></View>;

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

    <RiseButton label="Start today’s mission" onPress={() => router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any)} />

    <View style={styles.learningHeader}>
      <View style={styles.learningHeaderCopy}><RiseEyebrow>NEED A QUICK EXAMPLE?</RiseEyebrow><Text style={[styles.learningHeaderText, { color: theme.muted }]}>Use one trusted starting point, then return to the mission.</Text></View>
    </View>

    {isSpiritual ? <>
      <RiseCard style={styles.faithContext}><Text style={[styles.faithTitle, { color: theme.text }]}>{faithSource ? `Your ${profile.spiritualTradition} path` : "Your spiritual path"}</Text><Text style={[styles.faithText, { color: theme.muted }]} numberOfLines={2}>{profile.trustedSources?.trim() ? `Start with ${profile.trustedSources.trim()}. ` : "Choose a source meaningful to you. "}{faithSource?.text || "RISE will not choose a belief for you."}</Text></RiseCard>
      {faithSource ? <Pressable accessibilityRole="link" onPress={() => void openLearningResource(faithSource.url)} style={({ pressed }) => [styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]}><View style={styles.guideBody}><Text style={[styles.guideTitle, { color: theme.text }]}>{faithSource.label}</Text><Text style={[styles.guideReason, { color: theme.muted }]}>Open reading library</Text></View><Text style={[styles.guideArrow, { color: theme.accent }]}>Open</Text></Pressable> : null}
    </> : guides.length ? guides.slice(0, 1).map((guide) => <Pressable key={guide.url} accessibilityRole="link" onPress={() => void openLearningResource(guide.url)} style={({ pressed }) => [styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]}><View style={styles.guideBody}><Text style={[styles.guideTitle, { color: theme.text }]}>{guide.label}</Text><Text style={[styles.guideReason, { color: theme.muted }]} numberOfLines={1}>{guide.reason}</Text></View><Text style={[styles.guideArrow, { color: theme.accent }]}>Open</Text></Pressable>) : <Text style={[styles.sourceCaution, { color: theme.muted }]}>Start with a primary book or qualified teacher you trust.</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMoreLearning }} onPress={() => setShowMoreLearning((value) => !value)} style={[styles.moreToggle, { borderColor: theme.border }]}><Text style={[styles.moreToggleText, { color: theme.text }]}>{showMoreLearning ? "Hide extra learning options" : "More learning options"}</Text><Text style={[styles.moreToggleMark, { color: theme.accent }]}>{showMoreLearning ? "−" : "+"}</Text></Pressable>
    {showMoreLearning ? <View style={styles.moreLearning}>
      {!isSpiritual ? guides.slice(1).map((guide) => <Pressable key={guide.url} accessibilityRole="link" onPress={() => void openLearningResource(guide.url)} style={({ pressed }) => [styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]}><View style={styles.guideBody}><Text style={[styles.guideTitle, { color: theme.text }]}>{guide.label}</Text><Text style={[styles.guideReason, { color: theme.muted }]} numberOfLines={1}>{guide.reason}</Text></View><Text style={[styles.guideArrow, { color: theme.accent }]}>Open</Text></Pressable>) : null}
      <View style={styles.actionGap}><RiseButton variant="secondary" label={isSpiritual ? "Find a helpful video" : "Watch and learn"} onPress={() => void openLearningResource(isSpiritual ? spiritualVideoSearch(profile.spiritualTradition, mission.title) : mission.resourceUrl)} /></View>
    </View> : null}
    <Text style={[styles.sourceCaution, { color: theme.muted }]}>External results are not RISE endorsements. Check the source.</Text>
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.quizButton, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: .8 }]} onPress={() => router.push({ pathname: "/quiz", params: { skillId: mission.skillId, goal: mission.goal, goals: JSON.stringify(profile.selectedGoals), focusSkill: mission.focusSkill, missionTitle: mission.title, missionSteps: JSON.stringify(mission.steps), successCriteria: mission.successCriteria, reflectionPrompt: mission.reflectionPrompt || "" } } as any)}>
      <View><RiseEyebrow>RISE RANK TRIAL</RiseEyebrow><Text style={[styles.quizTitle, { color: theme.text }]}>Prove what I learned</Text><Text style={[styles.quizHelp, { color: theme.muted }]}>7 focused questions · instant coaching</Text></View><Text style={[styles.quizArrow, { color: theme.accent }]}>→</Text>
    </Pressable>
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
  loading:{flex:1,alignItems:"center",justifyContent:"center",paddingHorizontal:32},loadingText:{maxWidth:420,fontSize:14,lineHeight:21,textAlign:"center",marginTop:10},stateTitle:{fontSize:26,lineHeight:32,fontWeight:"900",textAlign:"center"},stateAction:{width:"100%",maxWidth:360,marginTop:22},page:{flex:1},content:{padding:22,paddingTop:58,paddingBottom:120},
  heading:{fontSize:34,lineHeight:40,fontWeight:"800",letterSpacing:-.7,marginTop:7},subtitle:{fontSize:15,lineHeight:22,marginTop:8,marginBottom:24},
  focusCard:{padding:18,marginBottom:22},focusTitle:{fontSize:19,fontWeight:"800",marginTop:8},focusText:{fontSize:13,lineHeight:19,marginTop:6},
  sequence:{borderTopWidth:1,borderBottomWidth:1,marginBottom:24},learningStep:{minHeight:52,flexDirection:"row",alignItems:"center",gap:12},stepNumber:{width:26,height:26,borderRadius:13,alignItems:"center",justifyContent:"center"},stepNumberText:{fontSize:11,fontWeight:"900"},stepTitle:{fontSize:13,fontWeight:"800"},
  learningHeader:{marginTop:28,marginBottom:2},learningHeaderCopy:{flex:1},learningHeaderText:{fontSize:12,lineHeight:18,marginTop:6},actionGap:{marginTop:12},moreToggle:{minHeight:52,borderTopWidth:1,borderBottomWidth:1,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:8},moreToggleText:{fontSize:12,fontWeight:"900"},moreToggleMark:{fontSize:22,fontWeight:"500"},moreLearning:{paddingTop:2},
  quizButton:{minHeight:82,flexDirection:"row",alignItems:"center",borderRadius:18,borderWidth:1,padding:15,marginTop:6,marginBottom:2},quizTitle:{fontSize:15,fontWeight:"800",marginTop:5},quizHelp:{fontSize:11,marginTop:3},quizArrow:{fontSize:22,fontWeight:"900",marginLeft:"auto"},
  guideCard:{minHeight:70,flexDirection:"row",alignItems:"center",borderRadius:14,borderWidth:1,padding:13,marginTop:11,marginBottom:9},guideBody:{flex:1},guideTitle:{fontSize:13,fontWeight:"800"},guideReason:{fontSize:11,lineHeight:17,marginTop:3},guideArrow:{fontSize:11,fontWeight:"900",marginLeft:8},sourceCaution:{fontSize:11,lineHeight:17,marginTop:8,marginBottom:10},
  faithContext:{padding:15,marginTop:11,marginBottom:12},faithTitle:{fontSize:13,fontWeight:"900"},faithText:{fontSize:12,lineHeight:19,marginTop:6},
});
