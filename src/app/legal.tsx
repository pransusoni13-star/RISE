import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LegalScreen() {
  const deleteLocalData = () => Alert.alert(
    "Delete all RISE data?",
    "This permanently removes your goals, missions, proof references, XP, coins, and preferences from this device.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(["RISE_PERSONALIZATION", "RISE_PROGRESS", "RISE_MISSION_RECORDS", "RISE_REWARD_REDEMPTIONS", "RISE_SELECTED_GOALS", "RISE_PRODUCT_FEEDBACK", "RISE_BETA_CONSENT"]);
        Alert.alert("Local data deleted", "RISE has removed its saved data from this device.", [{ text: "Start over", onPress: () => router.replace("/" as any) }]);
      } },
    ]
  );

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>RISE • PRIVACY & SAFETY</Text>
    <Text style={styles.title}>Clear by design.</Text>
    <Text style={styles.updated}>Beta disclosure version 2026-09-19 • legal review required before public launch</Text>

    <Section title="What RISE stores">
      Your goal, focus skill, mission state, reflections, progress, coins, and proof metadata are currently stored on this device using local app storage. RISE does not currently operate a cloud account or upload your proof to a RISE server.
    </Section>
    <Section title="Photos, camera, and video">
      RISE asks for access only after you choose an upload or camera action. The selected local file URI and proof type are stored so the app can remember completion. Do not attach private information you do not want retained on this device.
    </Section>
    <Section title="What proof review means">
      RISE checks attachment metadata, reflection quality, your mission-specific explanation, and your ownership confirmation before unlocking progress. These local consistency checks do not authenticate an image, identify who created it, detect every edited or unrelated file, or replace human review. Do not describe a proof as independently verified.
    </Section>
    <Section title="Optional faith and belief preferences">
      If you choose the Faith & Spirituality path, RISE can store the tradition and trusted-source words you voluntarily enter. This can be sensitive personal information. In this beta it stays in local app storage, is optional, is not used for advertising, and can be deleted with the control below.
    </Section>
    <Section title="External resources">
      YouTube and Google Maps links are supporting resources. Opening them leaves RISE and is governed by that provider’s terms and privacy practices. RISE does not claim ownership of third-party content.
    </Section>
    <Section title="Wellness, fitness, finance, and learning">
      Missions are educational and motivational suggestions, not medical, legal, financial, or professional advice. Stop any activity that feels unsafe and use qualified professionals for high-stakes decisions.
    </Section>
    <Section title="Your work">
      You keep ownership of the work and proof you create. Only submit material you created or have permission to use. Do not upload confidential, copyrighted, or identifying content without authorization.
    </Section>
    <Section title="Acceptable use">
      Do not use RISE to harm, harass, deceive, discriminate, break a law, violate another person’s privacy, or create dangerous instructions. You are responsible for checking that a mission is safe and lawful in your location.
    </Section>
    <Section title="Rewards and results">
      XP and RISE Coins are in-app progress markers with no cash value. RISE cannot promise employment, income, grades, health outcomes, audience growth, or any other specific result.
    </Section>
    <Section title="Payments, subscriptions, and refunds">
      RISE does not currently sell subscriptions or accept payments. The displayed three-month beta and proposed first-50 waitlist offer do not start billing. Before paid launch, RISE needs server-enforced eligibility, written promotion rules, Apple/Google purchase handling, restoration, cancellation information, an applicable refund policy, and exact pricing before confirmation. RISE Coins have no monetary value.
    </Section>
    <Section title="Cookies, analytics, and email">
      The current native beta does not set advertising cookies, include an analytics SDK, or send marketing email. A cookie banner or unsubscribe link would be misleading today. If the future website or app adds non-essential cookies, analytics, advertising, or email marketing, RISE must add the required notice, consent, and opt-out controls before enabling them.
    </Section>
    <Section title="Operator and contact details">
      Public launch is blocked until the legal person or business operating RISE publishes an accurate business name, address where legally required, support contact, Privacy Policy URL, Terms URL, and response process. Placeholder contact details are not used.
    </Section>
    <Section title="Age and family safety">
      This prototype does not yet include verified parental consent or age assurance. Before release to children, RISE needs age-appropriate notices, high-privacy defaults, parental controls where required, and a formal child-safety assessment.
    </Section>
    <Section title="Your choices">
      You can deny camera or photo permission and change it in device Settings. You can also delete all RISE data saved by this prototype using the button below.
    </Section>
    <Pressable accessibilityRole="button" style={styles.deleteButton} onPress={deleteLocalData}><Text style={styles.deleteText}>Delete all local RISE data</Text></Pressable>
    <Pressable accessibilityRole="button" style={styles.helpButton} onPress={() => router.push("/help" as any)}><Text style={styles.helpText}>Open Help Center →</Text></Pressable>
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>Before public release</Text>
      <Text style={styles.noticeText}>A lawyer should tailor the final Privacy Policy and Terms to the launch countries, age audience, business entity, analytics, subscriptions, and any future cloud backend. This screen is a truthful product disclosure, not legal advice.</Text>
    </View>
  </ScrollView>;
}

function Section({ title, children }: { title: string; children: string }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:45,paddingBottom:50},back:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:28,marginTop:-4},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,fontWeight:"900",marginTop:9},updated:{color:"#7A9B8A",fontSize:11,lineHeight:17,marginTop:8,marginBottom:24},
  card:{backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:16,marginBottom:11},cardTitle:{color:"#F5FFF9",fontSize:15,fontWeight:"900",marginBottom:7},cardText:{color:"#BBD8C8",fontSize:13,lineHeight:20},
  notice:{backgroundColor:"rgba(122,245,184,0.08)",borderRadius:17,borderWidth:1,borderColor:"rgba(122,245,184,0.22)",padding:16,marginTop:8},noticeTitle:{color:"#7AF5B8",fontSize:14,fontWeight:"900",marginBottom:6},noticeText:{color:"#DFFDEE",fontSize:12,lineHeight:19},
  deleteButton:{height:52,borderRadius:26,borderWidth:1,borderColor:"#8B4D49",alignItems:"center",justifyContent:"center",marginTop:10},deleteText:{color:"#FFB4A8",fontSize:13,fontWeight:"900"},
  helpButton:{height:52,borderRadius:26,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginTop:10,marginBottom:12},helpText:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},
});
