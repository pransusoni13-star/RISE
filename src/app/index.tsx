import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const steps = [
  { number: "01", title: "Choose what matters", detail: "One career skill and one life skill." },
  { number: "02", title: "Do one small mission", detail: "A clear task that fits your day." },
  { number: "03", title: "See yourself grow", detail: "Reflect, show your work, and keep going." },
];

export default function HomeScreen() {
  return <SafeAreaView style={styles.page}>
    <View pointerEvents="none" style={styles.arcTop} /><View pointerEvents="none" style={styles.arcBottom} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandLetter}>R</Text></View><Text style={styles.logo}>RISE</Text><Text style={styles.beta}>BETA</Text></View>
        <Text style={styles.eyebrow}>YOUR DAILY RISE</Text>
        <Text accessibilityRole="header" style={styles.title}>Build the version of you that sticks.</Text>
        <Text style={styles.subtitle}>Choose two skills you care about. RISE gives you one useful mission at a time, made for your goal and your schedule.</Text>
        <View style={styles.featureRow}><Text style={styles.feature}>🎯 Focus</Text><Text style={styles.feature}>📈 Progress</Text><Text style={styles.feature}>✨ Momentum</Text></View>
        <View style={styles.steps}>{steps.map((step, index) => <View key={step.number} style={[styles.step, index > 0 && styles.stepBorder]}><Text style={styles.stepNumber}>{step.number}</Text><View style={styles.stepBody}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepDetail}>{step.detail}</Text></View></View>)}</View>
        <Pressable accessibilityRole="button" accessibilityLabel="Build my free RISE plan" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Build my free plan</Text><Text style={styles.arrow}>→</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}><Text style={styles.signInText}>Already started? <Text style={styles.signInStrong}>Sign in</Text></Text></Pressable>
        <Text style={styles.promise}>Free during beta · No credit card · Your pace</Text>
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
  page:{flex:1,backgroundColor:"#010807",overflow:"hidden"},content:{flexGrow:1,width:"100%",maxWidth:520,alignSelf:"center",justifyContent:"center",paddingHorizontal:22,paddingTop:34,paddingBottom:30},
  arcTop:{position:"absolute",width:360,height:360,borderRadius:180,borderWidth:1,borderColor:"rgba(122,245,184,.16)",top:-240,right:-150},arcBottom:{position:"absolute",width:360,height:360,borderRadius:180,borderWidth:1,borderColor:"rgba(122,245,184,.16)",bottom:-240,left:-150},
  card:{backgroundColor:"#071B16",borderWidth:1,borderColor:"#29483B",borderRadius:28,padding:24},brandRow:{flexDirection:"row",alignItems:"center",marginBottom:28},brandMark:{width:36,height:36,borderRadius:11,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},brandLetter:{color:"#010807",fontSize:18,fontWeight:"900"},logo:{color:"#F5FFF9",fontSize:17,fontWeight:"900",letterSpacing:3,marginLeft:10},beta:{color:"#9FC3AF",fontSize:9,fontWeight:"800",letterSpacing:1,marginLeft:9,borderWidth:1,borderColor:"#315544",borderRadius:6,paddingHorizontal:7,paddingVertical:4},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:36,lineHeight:42,fontWeight:"800",letterSpacing:-.8,marginTop:12},subtitle:{color:"#C8EED9",fontSize:15,lineHeight:23,marginTop:13},featureRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:20,marginBottom:20},feature:{color:"#DFFDEE",fontSize:11,fontWeight:"700",backgroundColor:"#11382B",borderRadius:999,paddingHorizontal:10,paddingVertical:7},
  steps:{backgroundColor:"#0B251B",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",paddingHorizontal:15,marginBottom:20},step:{flexDirection:"row",alignItems:"center",paddingVertical:13},stepBorder:{borderTopWidth:1,borderTopColor:"#1E3A31"},stepNumber:{color:"#7AF5B8",fontSize:11,fontWeight:"900",width:33},stepBody:{flex:1},stepTitle:{color:"#F5FFF9",fontSize:13,fontWeight:"800"},stepDetail:{color:"#A7CBB7",fontSize:11,lineHeight:16,marginTop:2},
  primaryButton:{minHeight:56,borderRadius:14,backgroundColor:"#7AF5B8",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},primaryText:{color:"#010807",fontSize:15,fontWeight:"900"},arrow:{color:"#010807",fontSize:19,fontWeight:"800"},pressed:{opacity:.8,transform:[{scale:.99}]},signIn:{minHeight:44,alignItems:"center",justifyContent:"center"},signInText:{color:"#A7CBB7",fontSize:12},signInStrong:{color:"#F5FFF9",fontWeight:"800"},promise:{color:"#8FB6A2",fontSize:10,textAlign:"center",marginTop:3},links:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:10,marginTop:12},link:{color:"#A7CBB7",fontSize:11,fontWeight:"700",paddingVertical:10},linkDot:{color:"#507260"},
});
