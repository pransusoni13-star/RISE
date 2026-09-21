import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return <SafeAreaView style={styles.page}>
    <View style={styles.arcTop} />
    <View style={styles.arcBottom} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandLetter}>R</Text></View><Text style={styles.logo}>RISE</Text><View style={styles.beta}><Text style={styles.betaText}>BETA</Text></View></View>
      <View style={styles.hero}><Text style={styles.eyebrow}>ONE SMALL WIN AT A TIME</Text><Text style={styles.title}>Become better at what matters to you.</Text><Text style={styles.subtitle}>Choose one career skill and one life skill. RISE turns them into clear missions that fit the time you actually have.</Text></View>
      <View style={styles.example}>
        <View style={styles.exampleTop}><Text style={styles.exampleLabel}>A PLAN MADE FOR YOU</Text><Text style={styles.exampleTime}>20 min</Text></View>
        <Step number="1" title="Learn one useful idea" text="A trusted guide or video selected for your goal." />
        <View style={styles.connector} />
        <Step number="2" title="Put it into practice" text="A focused task you can finish today." />
        <View style={styles.connector} />
        <Step number="3" title="Show what you learned" text="Reflect, attach proof, and see your progress." />
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Start my first plan</Text><Text style={styles.buttonArrow}>→</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={styles.signIn}><Text style={styles.signInText}>Already have an account? <Text style={styles.signInStrong}>Sign in</Text></Text></Pressable>
      <View style={styles.promise}><Text style={styles.promiseIcon}>✓</Text><Text style={styles.promiseText}>Free during beta · No credit card · You control your data</Text></View>
      <View style={styles.links}><Pressable onPress={() => router.push("/feedback" as never)}><Text style={styles.link}>Feedback</Text></Pressable><Text style={styles.linkDot}>·</Text><Pressable onPress={() => router.push("/help" as never)}><Text style={styles.link}>Help</Text></Pressable><Text style={styles.linkDot}>·</Text><Pressable onPress={() => router.push("/legal" as never)}><Text style={styles.link}>Privacy & safety</Text></Pressable></View>
    </ScrollView>
  </SafeAreaView>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <View style={styles.step}><View style={styles.stepDot}><Text style={styles.stepNumber}>{number}</Text></View><View style={styles.stepBody}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#07110D",overflow:"hidden"},content:{width:"100%",maxWidth:560,alignSelf:"center",paddingHorizontal:24,paddingTop:30,paddingBottom:35},arcTop:{pointerEvents:"none",position:"absolute",width:360,height:360,borderRadius:180,borderWidth:1,borderColor:"rgba(125,226,173,.14)",top:-240,right:-150},arcBottom:{pointerEvents:"none",position:"absolute",width:360,height:360,borderRadius:180,borderWidth:1,borderColor:"rgba(125,226,173,.14)",bottom:-240,left:-150},brandRow:{flexDirection:"row",alignItems:"center",marginBottom:44},brandMark:{width:34,height:34,borderRadius:10,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center"},brandLetter:{color:"#07110D",fontSize:17,fontWeight:"900"},logo:{color:"#F6F8F5",fontSize:16,fontWeight:"800",letterSpacing:3,marginLeft:10},beta:{borderWidth:1,borderColor:"#314039",borderRadius:6,paddingHorizontal:6,paddingVertical:3,marginLeft:8},betaText:{color:"#84968D",fontSize:8,fontWeight:"800",letterSpacing:.8},hero:{marginBottom:27},eyebrow:{color:"#7DE2AD",fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:"#F6F8F5",fontSize:38,lineHeight:44,fontWeight:"700",letterSpacing:-1,marginTop:12},subtitle:{color:"#AEBDB5",fontSize:15,lineHeight:23,marginTop:13},example:{backgroundColor:"#0C1813",borderWidth:1,borderColor:"#213129",borderRadius:18,padding:18,marginBottom:18},exampleTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:16},exampleLabel:{color:"#879A90",fontSize:9,fontWeight:"800",letterSpacing:1.1},exampleTime:{color:"#7DE2AD",fontSize:10,fontWeight:"700",backgroundColor:"#172A21",paddingHorizontal:8,paddingVertical:4,borderRadius:6},step:{flexDirection:"row",alignItems:"center"},stepDot:{width:30,height:30,borderRadius:10,backgroundColor:"#172A21",alignItems:"center",justifyContent:"center",marginRight:12},stepNumber:{color:"#7DE2AD",fontSize:11,fontWeight:"800"},stepBody:{flex:1},stepTitle:{color:"#EAF1ED",fontSize:13,fontWeight:"700"},stepText:{color:"#7F9188",fontSize:10,lineHeight:15,marginTop:2},connector:{height:12,width:1,backgroundColor:"#2A4437",marginLeft:14,marginVertical:3},button:{height:56,borderRadius:12,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:10},pressed:{opacity:.82,transform:[{scale:.995}]},buttonText:{color:"#07110D",fontSize:14,fontWeight:"800"},buttonArrow:{color:"#07110D",fontSize:18,fontWeight:"700"},signIn:{minHeight:46,alignItems:"center",justifyContent:"center"},signInText:{color:"#82948B",fontSize:11},signInStrong:{color:"#CDE2D6",fontWeight:"700"},promise:{flexDirection:"row",alignItems:"center",justifyContent:"center",marginTop:5},promiseIcon:{color:"#7DE2AD",fontSize:11,marginRight:7},promiseText:{color:"#6E8077",fontSize:9},links:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,marginTop:20},link:{color:"#778A80",fontSize:10,fontWeight:"600",paddingVertical:7},linkDot:{color:"#38483F"},
});
