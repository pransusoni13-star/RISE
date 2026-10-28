import { router } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/support";

const UPDATED = "October 23, 2026";

export default function TermsScreen() {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>RISE TERMS OF USE</Text>
    <Text accessibilityRole="header" style={styles.title}>Clear rules for the beta.</Text>
    <Text style={styles.updated}>Effective and last updated {UPDATED}</Text>
    <Text style={styles.intro}>These Terms govern use of RISE: Daily Skill Missions. By creating a plan or account, you agree to these Terms and acknowledge the Privacy Policy and Safety Disclosure.</Text>

    <Section title="Eligibility and accounts">You must be at least 13 and legally able to agree to these Terms. If local law requires parental permission at your age, a parent or guardian must provide it. Give accurate account information, protect your password and sign-in links, and tell support promptly about suspected unauthorized access.</Section>
    <Section title="What RISE provides">RISE is an educational self-improvement and planning tool. It suggests missions, quizzes, projects, reminders, and progress markers. It is not medical, mental-health, legal, financial, religious, employment, or other professional advice. Use qualified professionals for high-stakes decisions and stop any activity that is unsafe for you.</Section>
    <Section title="Your license to use RISE">RISE gives you a personal, limited, revocable, non-exclusive, non-transferable license to use the beta for lawful personal purposes. You may not copy, sell, reverse engineer, disrupt, scrape, or misuse the service except where applicable law expressly permits it.</Section>
    <Section title="Your content and proof">You keep ownership of your reflections, projects, and proof. You give RISE only the limited permission needed to store and process information you deliberately sync or submit to operate the service and support you. Proof photos and videos stay on your device in this beta. Submit only content you created or have permission to use; do not submit confidential or unlawful material.</Section>
    <Section title="Acceptable use">Do not use RISE to harm, harass, deceive, discriminate, break the law, invade privacy, infringe intellectual property, bypass security, distribute malware, or create dangerous instructions. RISE may restrict or end access needed to protect users, the service, or legal rights.</Section>
    <Section title="Beta availability and changes">The beta may contain errors, change, pause, or stop. RISE does not promise uninterrupted availability, permanent storage, or compatibility with every device. Important data should be exported before deleting an account or leaving the beta.</Section>
    <Section title="Rewards and payment">The current beta is free and does not accept payment. XP, ranks, streaks, and RISE Coins are progress markers only, have no cash value, cannot be transferred, and do not guarantee any outcome. Any future paid feature will require separate price, renewal, cancellation, and store disclosures before purchase.</Section>
    <Section title="External services">Links to Apple, YouTube, Google Maps, and other services open products controlled by those providers. Their terms and privacy practices apply. A link does not mean RISE endorses or controls the external content.</Section>
    <Section title="Results and disclaimers">RISE does not guarantee income, employment, grades, health, audience growth, virality, retention, or any specific result. To the fullest extent permitted by applicable law, the beta is provided “as is” and “as available.” Nothing in these Terms excludes a right or remedy that cannot legally be excluded.</Section>
    <Section title="Responsibility and liability">You are responsible for deciding whether a mission is safe, lawful, and suitable. To the fullest extent permitted by applicable law, RISE is not liable for indirect, incidental, special, consequential, or lost-profit damages arising from beta use. This limitation does not apply where prohibited or to liability that cannot legally be limited.</Section>
    <Section title="Deletion and ending use">You can stop using RISE at any time. Settings lets you erase local data and, when signed in, request deletion of the account and active-service records. RISE may suspend access for serious misuse, security risk, or legal necessity. Provisions that logically survive termination—including ownership, disclaimers, and lawful limitations—remain effective.</Section>
    <Section title="Changes and applicable law">Material changes will be identified in the app or through another appropriate notice before they take effect. Mandatory consumer and privacy protections in your location continue to apply. The final operator legal name, address, and launch-jurisdiction clause must be completed before App Store release; RISE will not invent those details.</Section>
    <Section title="Contact">Questions about these Terms can be sent to {SUPPORT_EMAIL}. Never email a password, verification token, or private proof file.</Section>

    <Pressable accessibilityRole="link" onPress={() => router.push("/privacy" as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Read the Privacy Policy</Text></Pressable>
    <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Read the Safety Disclosure</Text></Pressable>
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(SUPPORT_MAILTO)} style={styles.contactButton}><Text style={styles.contactText}>Contact support</Text></Pressable>
  </ScrollView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{width:"100%",maxWidth:760,alignSelf:"center",padding:22,paddingTop:45,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900",marginTop:9},updated:{color:"#7A9B8A",fontSize:11,lineHeight:17,marginTop:8},intro:{color:"#D4EBDD",fontSize:15,lineHeight:23,marginTop:18,marginBottom:24},
  card:{backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:17,marginBottom:11},cardTitle:{color:"#F5FFF9",fontSize:15,fontWeight:"900",marginBottom:7},cardText:{color:"#BBD8C8",fontSize:13,lineHeight:20},
  contactButton:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:10},contactText:{color:"#010807",fontSize:14,fontWeight:"900"},secondaryButton:{height:54,borderRadius:27,borderWidth:1,borderColor:"#315845",alignItems:"center",justifyContent:"center",marginTop:10},secondaryText:{color:"#CFF7DF",fontSize:13,fontWeight:"900"},
});
