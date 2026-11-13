import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/support";
import { useRiseAppearance } from "../services/appearance";

const resources = [
  {
    title: "A daily reminder did not appear",
    text: "Open RISE Settings to check whether your reminder is on. Then check the phone's RISE notification permission and Focus settings. Your mission remains available on Today even when a phone alert is delayed or silenced.",
  },
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
  const { theme } = useRiseAppearance();
  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open resource", "Please check your connection and try again.");
    }
  };

  return (
    <ScrollView style={[styles.page, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: theme.accent }]}>RISE HELP CENTER</Text>
      <Text style={[styles.title, { color: theme.text }]}>Help that meets you where you are.</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Quick answers for proof, safety, privacy, and getting useful support.</Text>

      <Pressable accessibilityRole="button" style={[styles.tourButton, { backgroundColor: theme.surfaceStrong, borderColor: theme.blueBorder }]} onPress={() => router.push("/tour" as any)}>
        <Text style={[styles.tourEyebrow, { color: theme.accent }]}>NEW TO RISE?</Text>
        <Text style={[styles.tourTitle, { color: theme.text }]}>Take the guided app tour →</Text>
        <Text style={[styles.tourText, { color: theme.muted }]}>Learn where every main feature lives and what to do next.</Text>
      </Pressable>

      <Text style={[styles.section, { color: theme.muted }]}>CONTACT RISE</Text>
      <Resource title="Email support" detail={SUPPORT_EMAIL} onPress={() => open(SUPPORT_MAILTO)} />
      <Text selectable style={[styles.subtitle, { color: theme.muted }]}>Include your device, app version, what happened, and what you expected. Never send passwords, sign-in codes, or private proof. If your email app does not open, copy the address above into your email service. Support is not monitored for emergencies.</Text>

      {resources.map((item, index) => (
        <View key={item.title} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.number, { backgroundColor: theme.blueSurface }]}><Text style={[styles.numberText, { color: theme.accent }]}>{index + 1}</Text></View>
          <View style={styles.cardBody}><Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.cardText, { color: theme.muted }]}>{item.text}</Text></View>
        </View>
      ))}

      <Text style={[styles.section, { color: theme.muted }]}>TRUSTED EXTERNAL HELP</Text>
      <Resource title="Find local emotional-support services" detail="Global directory by country" onPress={() => open("https://findahelpline.com/")} />
      <Resource title="Google Safety Center" detail="Privacy, security, and family resources" onPress={() => open("https://safety.google/")} />
      <Resource title="YouTube Help" detail="Copyright, privacy, and creator guidance" onPress={() => open("https://support.google.com/youtube/")} />

      <View style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.mode === "dark" ? "#633B38" : "#D9A29C" }]}>
        <Text style={styles.noticeTitle}>In immediate danger?</Text>
        <Text style={[styles.noticeText, { color: theme.text }]}>RISE is not an emergency service. Contact your local emergency number or a trusted person nearby.</Text>
      </View>

      <Pressable accessibilityRole="button" style={[styles.legalButton, { backgroundColor: theme.accent }]} onPress={() => router.push("/legal" as any)}>
        <Text style={[styles.legalButtonText, { color: theme.accentInk }]}>Read Privacy, Safety & Terms →</Text>
      </Pressable>
    </ScrollView>
  );
}

function Resource({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  const { theme } = useRiseAppearance();
  return <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.resource, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
    <View style={styles.cardBody}><Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.cardText, { color: theme.muted }]}>{detail}</Text></View><Text style={[styles.arrow, { color: theme.accent }]}>↗</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1},content:{width:"100%",maxWidth:760,alignSelf:"center",padding:22,paddingTop:30,paddingBottom:60},
  eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{fontSize:36,lineHeight:42,fontWeight:"900",marginTop:10},subtitle:{fontSize:15,lineHeight:23,marginTop:12,marginBottom:24},
  card:{flexDirection:"row",borderRadius:18,borderWidth:1,padding:15,marginBottom:10},number:{width:32,height:32,borderRadius:16,alignItems:"center",justifyContent:"center",marginRight:12},numberText:{fontWeight:"900"},cardBody:{flex:1},cardTitle:{fontSize:14,fontWeight:"900"},cardText:{fontSize:12,lineHeight:18,marginTop:5},
  section:{fontSize:10,fontWeight:"900",letterSpacing:1.3,marginTop:20,marginBottom:10},resource:{flexDirection:"row",alignItems:"center",borderRadius:16,borderWidth:1,padding:15,marginBottom:9},arrow:{fontSize:20,marginLeft:10},
  notice:{borderWidth:1,borderRadius:17,padding:16,marginTop:18},noticeTitle:{color:"#C45145",fontWeight:"900"},noticeText:{fontSize:12,lineHeight:19,marginTop:6},
  legalButton:{height:58,borderRadius:29,alignItems:"center",justifyContent:"center",marginTop:18},legalButtonText:{fontWeight:"900",fontSize:14},
  tourButton:{borderRadius:20,borderWidth:1,padding:18,marginBottom:6},tourEyebrow:{fontSize:9,fontWeight:"900",letterSpacing:1.2},tourTitle:{fontSize:18,fontWeight:"900",marginTop:7},tourText:{fontSize:12,lineHeight:18,marginTop:5},
});
