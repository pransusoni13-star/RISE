import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hasSavedProfile } from "../services/personalization";

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
        <Text style={styles.eyebrow}>YOUR NEXT WIN STARTS NOW</Text>
        <Text accessibilityRole="header" style={styles.title}>One mission. Real progress.</Text>
        <Text style={styles.subtitle}>Choose one thing to improve. RISE gives you a focused action you can finish today.</Text>
        <View accessibilityLabel="How RISE works" style={styles.valueCard}>
          <Text style={styles.valueLabel}>IN LESS THAN A MINUTE</Text>
          <Text style={styles.valueTitle}>Pick a direction → get today’s mission</Text>
          <Text style={styles.valueText}>No long setup. No crowded dashboard. Just the clearest next step.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Get my first RISE mission" onPress={() => router.push("/popular-skills" as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Get my first mission</Text><Text style={styles.arrow}>→</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}><Text style={styles.signInText}>Already started? <Text style={styles.signInStrong}>Sign in</Text></Text></Pressable>
        <Text style={styles.promise}>Free during beta · No account required to start</Text>
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
  card:{backgroundColor:"#071B16",borderWidth:1,borderColor:"#315544",borderRadius:20,paddingHorizontal:22,paddingTop:25,paddingBottom:21},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.3},title:{color:"#F5FFF9",fontSize:39,lineHeight:44,fontWeight:"900",letterSpacing:-1.2,marginTop:11},subtitle:{color:"#C4DACD",fontSize:15,lineHeight:23,fontWeight:"600",marginTop:13},
  valueCard:{backgroundColor:"#0B251B",borderLeftWidth:3,borderLeftColor:"#7AF5B8",paddingVertical:16,paddingHorizontal:16,marginTop:22,marginBottom:20},valueLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},valueTitle:{color:"#F0FAF4",fontSize:15,lineHeight:20,fontWeight:"900",marginTop:7},valueText:{color:"#9FC3AF",fontSize:11,lineHeight:17,marginTop:5},
  primaryButton:{minHeight:56,borderRadius:10,backgroundColor:"#7AF5B8",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},primaryText:{color:"#010807",fontSize:15,fontWeight:"900"},arrow:{color:"#010807",fontSize:19,fontWeight:"900"},pressed:{opacity:.82,transform:[{scale:.99}]},signIn:{minHeight:44,alignItems:"center",justifyContent:"center"},signInText:{color:"#A7CBB7",fontSize:12},signInStrong:{color:"#F5FFF9",fontWeight:"900"},promise:{color:"#8FB6A2",fontSize:10,lineHeight:15,textAlign:"center",marginTop:2},links:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:10,marginTop:10},link:{color:"#A7CBB7",fontSize:11,fontWeight:"700",paddingVertical:10},linkDot:{color:"#507260"},
});
