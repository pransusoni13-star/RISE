import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hasSavedProfile } from "../services/personalization";

const steps = [
  { number: "01", title: "Choose what matters", detail: "One career direction and one life priority." },
  { number: "02", title: "Do today’s mission", detail: "A clear, realistic action sized to your time." },
  { number: "03", title: "Build proof of growth", detail: "Reflect, show your work, and see what improved." },
];

export default function HomeScreen() {
  const [checkingPlan, setCheckingPlan] = useState(true);

  useEffect(() => {
    let active = true;
    void hasSavedProfile()
      .then((hasPlan) => {
        if (!active) return;
        if (hasPlan) {
          router.replace("/(tabs)/today" as never);
          return;
        }
        setCheckingPlan(false);
      })
      .catch(() => {
        if (active) setCheckingPlan(false);
      });
    return () => { active = false; };
  }, []);

  if (checkingPlan) {
    return <SafeAreaView style={styles.loadingPage}><ActivityIndicator color="#7AF5B8" /><Text style={styles.loadingText}>Opening your RISE home…</Text></SafeAreaView>;
  }

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}><Text style={styles.logo}>RISE</Text><Text style={styles.beta}>PUBLIC BETA</Text></View>
      <View style={styles.card}>
      <Text style={styles.eyebrow}>GROW 1% EVERY DAY</Text>
      <Text accessibilityRole="header" style={styles.title}>Learn less. Do more.</Text>
      <Text style={styles.subtitle}>One personalized mission. Real proof. Visible progress.</Text>
        <View accessibilityLabel="A balanced plan for career and life growth" style={styles.focusRow}>
          <View style={styles.focusItem}><Text style={styles.focusLabel}>CAREER</Text><Text style={styles.focusText}>Build useful skills</Text></View>
          <View pointerEvents="none" style={styles.focusDivider} />
          <View style={styles.focusItem}><Text style={styles.focusLabel}>LIFE</Text><Text style={styles.focusText}>Strengthen what matters</Text></View>
        </View>
        <View style={styles.steps}>{steps.map((step, index) => <View key={step.number} style={[styles.step, index > 0 && styles.stepBorder]}><Text style={styles.stepNumber}>{step.number}</Text><View style={styles.stepBody}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepDetail}>{step.detail}</Text></View></View>)}</View>
        <Pressable accessibilityRole="button" accessibilityLabel="Build my free RISE plan" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Build my plan</Text><Text style={styles.arrow}>→</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}><Text style={styles.signInText}>Already started? <Text style={styles.signInStrong}>Sign in</Text></Text></Pressable>
        <Text style={styles.promise}>Free during beta · No credit card · Built around your pace</Text>
      </View>
      <View style={styles.links}>
        <Pressable accessibilityRole="link" onPress={() => router.push("/feedback" as never)}><Text style={styles.link}>Feedback</Text></Pressable><Text style={styles.linkDot}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/rewards" as never)}><Text style={styles.link}>Rewards</Text></Pressable><Text style={styles.linkDot}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/help" as never)}><Text style={styles.link}>Help</Text></Pressable><Text style={styles.linkDot}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)}><Text style={styles.link}>Privacy</Text></Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  loadingPage:{flex:1,backgroundColor:"#010807",alignItems:"center",justifyContent:"center",gap:12},loadingText:{color:"#9FC3AF",fontSize:12,fontWeight:"800"},
  page:{flex:1,backgroundColor:"#010807"},content:{flexGrow:1,width:"100%",maxWidth:520,alignSelf:"center",justifyContent:"center",paddingHorizontal:20,paddingTop:24,paddingBottom:26},
  brandRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:14,paddingHorizontal:3},logo:{color:"#F5FFF9",fontSize:18,fontWeight:"900",letterSpacing:4},beta:{color:"#9FC3AF",fontSize:9,fontWeight:"900",letterSpacing:1.1,borderWidth:1,borderColor:"#315544",borderRadius:5,paddingHorizontal:8,paddingVertical:5},
  card:{backgroundColor:"#071B16",borderWidth:1,borderColor:"#315544",borderRadius:20,paddingHorizontal:22,paddingTop:25,paddingBottom:21},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.3},title:{color:"#F5FFF9",fontSize:36,lineHeight:41,fontWeight:"900",letterSpacing:-1,marginTop:11},subtitle:{color:"#C4DACD",fontSize:15,lineHeight:23,fontWeight:"600",marginTop:13},
  focusRow:{flexDirection:"row",alignItems:"stretch",backgroundColor:"#0B251B",borderLeftWidth:3,borderLeftColor:"#7AF5B8",paddingVertical:13,paddingHorizontal:14,marginTop:21},focusItem:{flex:1},focusDivider:{width:1,backgroundColor:"#29483B",marginHorizontal:13},focusLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},focusText:{color:"#F0FAF4",fontSize:11,lineHeight:16,fontWeight:"800",marginTop:4},
  steps:{borderTopWidth:1,borderBottomWidth:1,borderColor:"#1E3A31",marginTop:22,marginBottom:20},step:{flexDirection:"row",alignItems:"flex-start",paddingVertical:12},stepBorder:{borderTopWidth:1,borderTopColor:"#1E3A31"},stepNumber:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:.6,width:34,paddingTop:2},stepBody:{flex:1},stepTitle:{color:"#F5FFF9",fontSize:13,fontWeight:"900"},stepDetail:{color:"#9FC3AF",fontSize:11,lineHeight:17,marginTop:3},
  primaryButton:{minHeight:56,borderRadius:10,backgroundColor:"#7AF5B8",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},primaryText:{color:"#010807",fontSize:15,fontWeight:"900"},arrow:{color:"#010807",fontSize:19,fontWeight:"900"},pressed:{opacity:.82,transform:[{scale:.99}]},signIn:{minHeight:44,alignItems:"center",justifyContent:"center"},signInText:{color:"#A7CBB7",fontSize:12},signInStrong:{color:"#F5FFF9",fontWeight:"900"},promise:{color:"#8FB6A2",fontSize:10,lineHeight:15,textAlign:"center",marginTop:2},links:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:10,marginTop:10},link:{color:"#A7CBB7",fontSize:11,fontWeight:"700",paddingVertical:10},linkDot:{color:"#507260"},
});
