import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { getLeaderboard, getProgressDashboard, LeaderboardSnapshot, ProgressDashboard, setLeaderboardOptIn } from "../services/auth";
import { RiseTheme, useRiseAppearance } from "../services/appearance";

export default function AccountProgressScreen() {
  const { theme } = useRiseAppearance();
  const styles = createStyles(theme);
  const comparisonStyles = createComparisonStyles(theme);
  const [dashboard, setDashboard] = useState<ProgressDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getProgressDashboard().then((value) => { setDashboard(value); if (!value) setError("Sign in to track improvement across devices."); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load synced progress.")).finally(() => setLoading(false)); }, []);
  const [comparison, setComparison] = useState<LeaderboardSnapshot | null>(null);
  const [changingComparison, setChangingComparison] = useState(false);
  useEffect(() => { void getLeaderboard().then(setComparison).catch(() => undefined); }, []);

  const toggleComparison = async () => {
    if (!comparison || changingComparison) return;
    setChangingComparison(true);
    try { setComparison(await setLeaderboardOptIn(!comparison.opted_in)); }
    catch { setError("Could not update comparison. Please try again."); }
    finally { setChangingComparison(false); }
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.topBar}><View><Text style={styles.topTitle}>Your progress</Text><Text style={styles.topHint}>Synced across your devices</Text></View></View>
    <Text style={styles.eyebrow}>SMALL WINS, MADE VISIBLE</Text><Text style={styles.title}>See how far you’ve come.</Text>
    <Text style={styles.subtitle}>Your first quiz gives you a starting point. Missions and later quizzes show the movement—not your worth.</Text>
    {loading ? <ActivityIndicator color="#7AF5B8" style={styles.loader} /> : error ? <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => router.replace("/account" as never)} style={styles.button}><Text style={styles.buttonText}>Open Account →</Text></Pressable></View> : dashboard ? <>
      <View style={styles.memberCard}><Text style={styles.memberLabel}>{dashboard.user.is_founding_member ? "FOUNDING MEMBER" : "RISE BETA MEMBER"}</Text><Text style={styles.memberName}>{dashboard.user.display_name}</Text><Text style={styles.memberEmail}>{dashboard.user.email}</Text>{dashboard.user.founding_expires_at ? <Text style={styles.memberExpiry}>Founding year reserved through {new Date(dashboard.user.founding_expires_at).toLocaleDateString()}</Text> : null}</View>
      <View style={styles.stats}><Stat value={dashboard.total_missions} label="Missions done" /><Stat value={formatMinutes(dashboard.total_minutes)} label="Time invested" /><Stat value={dashboard.skills.length} label="Skills growing" /></View>
      {comparison ? <View style={comparisonStyles.card}><Text style={comparisonStyles.eyebrow}>OPTIONAL MONTHLY COMMUNITY CHALLENGE</Text><Text style={comparisonStyles.title}>{comparison.opted_in && comparison.rank ? comparison.participants > 1 ? `#${comparison.rank} of ${comparison.participants} members this month` : "You’re the first member here this month" : "Grow at your own pace."}</Text>{comparison.opted_in ? <View style={comparisonStyles.rankRow}><Text style={comparisonStyles.rankStat}>🎯 {comparison.missions} missions this month</Text><Text style={comparisonStyles.rankStat}>🏅 {comparison.participants >= 4 && comparison.rank && comparison.rank <= Math.ceil(comparison.participants / 2) ? "Top half" : "Keep building"}</Text></View> : null}<Text style={comparisonStyles.body}>{comparison.opted_in ? "Your next challenge: finish one mission with a clear reflection. Your personal progress matters more than your place." : "Join only if a private monthly comparison motivates you. You can leave at any time."}</Text><Text style={comparisonStyles.disclaimer}>Ranks reset on the first day of each UTC month and use member-reported completions among people who opted in. No names or proof are shown, and results are not independently verified.</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: changingComparison }} disabled={changingComparison} onPress={() => void toggleComparison()} style={({ pressed }) => [comparisonStyles.button, pressed && { opacity: .8 }]}><Text style={comparisonStyles.buttonText}>{changingComparison ? "Updating…" : comparison.opted_in ? "Leave comparison" : "Join comparison"}</Text></Pressable></View> : null}
      <Text style={styles.section}>YOUR SKILLS</Text>
      {dashboard.skills.length ? dashboard.skills.map((skill) => <View key={skill.skill_slug} style={styles.skillCard}><View style={styles.skillTop}><View style={styles.skillIcon}><Text style={styles.skillIconText}>↗</Text></View><View style={styles.skillHeading}><Text style={styles.skillName}>{skill.skill_slug.replace(/-/g, " ")}</Text><Text style={styles.skillMeta}>{skill.missions_completed} missions · {formatMinutes(skill.minutes_logged)}</Text></View><Text style={[styles.change, (skill.improvement_points || 0) > 0 && styles.changePositive]}>{skill.improvement_points == null ? "Starting" : `${skill.improvement_points >= 0 ? "+" : ""}${skill.improvement_points} pts`}</Text></View><View style={styles.scoreRow}><View><Text style={styles.scoreLabel}>STARTED AT</Text><Text style={styles.score}>{skill.baseline_score == null ? "—" : `${skill.baseline_score}%`}</Text></View><View style={styles.progressLine}><View style={[styles.progressFill,{width:`${Math.max(6,Math.min(100,skill.latest_score || 0))}%`}]} /></View><View style={styles.latest}><Text style={styles.scoreLabel}>NOW</Text><Text style={styles.score}>{skill.latest_score == null ? "—" : `${skill.latest_score}%`}</Text></View></View></View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>Your first win will show up here.</Text><Text style={styles.emptyText}>Complete a mission or quiz to create a starting point. No pressure—progress needs somewhere to begin.</Text></View>}
      <Text style={styles.disclosure}>Scores show progress inside RISE activities. They do not certify professional ability, employment readiness, fitness outcomes, or mastery.</Text>
    </> : null}
  </ScrollView>;
}

function formatMinutes(value: number) { return value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value}m`; }
function Stat({ value, label }: { value: number | string; label: string }) {
  const { theme } = useRiseAppearance();
  const styles = createStyles(theme);
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function createStyles(theme: RiseTheme) {
  return StyleSheet.create({
    page:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:680,alignSelf:"center",padding:24,paddingTop:30,paddingBottom:60},topBar:{flexDirection:"row",alignItems:"center",gap:12,marginBottom:30},topTitle:{color:theme.text,fontSize:13,fontWeight:"700"},topHint:{color:theme.muted,fontSize:10,marginTop:2},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"800",letterSpacing:1.4},title:{color:theme.text,fontSize:36,lineHeight:43,fontWeight:"700",letterSpacing:-.8,marginTop:10},subtitle:{color:theme.muted,fontSize:15,lineHeight:23,marginTop:11,marginBottom:24},loader:{marginTop:35},
    memberCard:{backgroundColor:theme.surfaceStrong,borderWidth:1,borderColor:theme.blueBorder,borderRadius:16,padding:17,marginBottom:12},memberLabel:{color:theme.accent,fontSize:9,fontWeight:"800",letterSpacing:1.2},memberName:{color:theme.text,fontSize:19,fontWeight:"700",marginTop:7},memberEmail:{color:theme.muted,fontSize:11,marginTop:3},memberExpiry:{color:theme.accent,fontSize:11,fontWeight:"700",marginTop:9},
    stats:{flexDirection:"row",gap:8,marginBottom:26},stat:{flex:1,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,borderRadius:14,padding:13,minHeight:82,justifyContent:"center"},statValue:{color:theme.text,fontSize:21,fontWeight:"700"},statLabel:{color:theme.muted,fontSize:9,fontWeight:"600",marginTop:5},section:{color:theme.muted,fontSize:10,fontWeight:"800",letterSpacing:1.2,marginBottom:11},
    skillCard:{backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,borderRadius:16,padding:16,marginBottom:10},skillTop:{flexDirection:"row",alignItems:"center",gap:11},skillIcon:{width:38,height:38,borderRadius:12,backgroundColor:theme.blueSurface,alignItems:"center",justifyContent:"center"},skillIconText:{color:theme.accent,fontSize:17,fontWeight:"700"},skillHeading:{flex:1},skillName:{color:theme.text,fontSize:15,fontWeight:"700",textTransform:"capitalize"},skillMeta:{color:theme.muted,fontSize:10,marginTop:3},change:{color:theme.muted,fontSize:11,fontWeight:"700",backgroundColor:theme.blueSurface,borderRadius:6,paddingHorizontal:8,paddingVertical:5},changePositive:{color:theme.accent,backgroundColor:theme.surfaceStrong},
    scoreRow:{flexDirection:"row",alignItems:"center",gap:10,marginTop:16},scoreLabel:{color:theme.muted,fontSize:8,fontWeight:"800",letterSpacing:.6},score:{color:theme.text,fontSize:14,fontWeight:"700",marginTop:3},latest:{alignItems:"flex-end"},progressLine:{height:4,backgroundColor:theme.border,borderRadius:2,flex:1,overflow:"hidden"},progressFill:{height:4,backgroundColor:theme.accent,borderRadius:2},
    empty:{backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,borderRadius:16,padding:18},emptyTitle:{color:theme.text,fontSize:15,fontWeight:"700",marginBottom:6},emptyText:{color:theme.muted,fontSize:13,lineHeight:20},button:{height:50,borderRadius:12,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:14},buttonText:{color:theme.accentInk,fontWeight:"800"},disclosure:{color:theme.muted,fontSize:10,lineHeight:16,marginTop:15},
  });
}

function createComparisonStyles(theme: RiseTheme) {
  return StyleSheet.create({
    card:{backgroundColor:theme.blueSurface,borderWidth:1,borderColor:theme.blueBorder,borderRadius:16,padding:17,marginBottom:25},eyebrow:{color:theme.accent,fontSize:9,fontWeight:"800",letterSpacing:1.1},title:{color:theme.text,fontSize:19,fontWeight:"800",marginTop:7},rankRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:11},rankStat:{color:theme.text,fontSize:11,fontWeight:"800",backgroundColor:theme.surfaceStrong,borderRadius:999,paddingHorizontal:10,paddingVertical:7},body:{color:theme.muted,fontSize:12,lineHeight:19,marginTop:11},disclaimer:{color:theme.muted,fontSize:10,lineHeight:16,marginTop:8},button:{minHeight:44,borderRadius:10,borderWidth:1,borderColor:theme.blueBorder,alignItems:"center",justifyContent:"center",marginTop:13},buttonText:{color:theme.accent,fontSize:12,fontWeight:"700"},
  });
}
