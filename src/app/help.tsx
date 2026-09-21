import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

const resources = [
  {
    title: "Fix photo or camera access",
    text: "Open your phone Settings, choose RISE, then review Photos, Camera, and Microphone access. Return to RISE and tap the proof button again.",
  },
  {
    title: "A mission feels unsafe",
    text: "Stop immediately. Replace it with a safe, lower-risk practice step. RISE is educational support—not medical, legal, financial, or emergency advice.",
  },
  {
    title: "Protect private information",
    text: "Crop names, faces, addresses, customer details, school information, and confidential work from proof before attaching it.",
  },
  {
    title: "Use content legally",
    text: "Attach work you created or have permission to use. Link to third-party examples instead of copying or republishing them.",
  },
];

export default function HelpScreen() {
  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open resource", "Please check your connection and try again.");
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>RISE HELP CENTER</Text>
      <Text style={styles.title}>Help that meets you where you are.</Text>
      <Text style={styles.subtitle}>Quick answers for proof, safety, privacy, and getting useful support.</Text>

      {resources.map((item, index) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
          <View style={styles.cardBody}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.text}</Text></View>
        </View>
      ))}

      <Text style={styles.section}>TRUSTED EXTERNAL HELP</Text>
      <Resource title="Find local emotional-support services" detail="Global directory by country" onPress={() => open("https://findahelpline.com/")} />
      <Resource title="Google Safety Center" detail="Privacy, security, and family resources" onPress={() => open("https://safety.google/")} />
      <Resource title="YouTube Help" detail="Copyright, privacy, and creator guidance" onPress={() => open("https://support.google.com/youtube/")} />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>In immediate danger?</Text>
        <Text style={styles.noticeText}>RISE is not an emergency service. Contact your local emergency number or a trusted person nearby.</Text>
      </View>

      <Pressable style={styles.legalButton} onPress={() => router.push("/legal" as any)}>
        <Text style={styles.legalButtonText}>Read Privacy, Safety & Terms →</Text>
      </Pressable>
    </ScrollView>
  );
}

function Resource({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.resource, pressed && { opacity: 0.7 }]}>
    <View style={styles.cardBody}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{detail}</Text></View><Text style={styles.arrow}>↗</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:45,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:36,lineHeight:42,fontWeight:"900",marginTop:10},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:23,marginTop:12,marginBottom:24},
  card:{flexDirection:"row",backgroundColor:"#071B16",borderRadius:18,borderWidth:1,borderColor:"#1E3A31",padding:15,marginBottom:10},number:{width:32,height:32,borderRadius:16,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginRight:12},numberText:{color:"#7AF5B8",fontWeight:"900"},cardBody:{flex:1},cardTitle:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},cardText:{color:"#A7CBB7",fontSize:12,lineHeight:18,marginTop:5},
  section:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.3,marginTop:20,marginBottom:10},resource:{flexDirection:"row",alignItems:"center",backgroundColor:"#071B16",borderRadius:16,borderWidth:1,borderColor:"#1E3A31",padding:15,marginBottom:9},arrow:{color:"#7AF5B8",fontSize:20,marginLeft:10},
  notice:{backgroundColor:"rgba(255,180,168,0.08)",borderColor:"rgba(255,180,168,0.25)",borderWidth:1,borderRadius:17,padding:16,marginTop:18},noticeTitle:{color:"#FFB4A8",fontWeight:"900"},noticeText:{color:"#DCECE3",fontSize:12,lineHeight:19,marginTop:6},
  legalButton:{height:58,borderRadius:29,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:18},legalButtonText:{color:"#010807",fontWeight:"900",fontSize:14},
});
