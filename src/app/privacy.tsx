import { router } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/support";

const UPDATED = "September 29, 2026";

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>RISE PRIVACY POLICY</Text>
      <Text accessibilityRole="header" style={styles.title}>Privacy in plain language.</Text>
      <Text style={styles.updated}>Effective and last updated {UPDATED}</Text>
      <Text style={styles.intro}>
        This policy explains how RISE: Daily Skill Missions handles information in the beta. It applies to the RISE mobile app, website, and account service.
      </Text>

      <Section title="Who is responsible">
        RISE operates this beta. For privacy questions, access requests, or deletion help, email {SUPPORT_EMAIL}. Do not send passwords, sign-in codes, or private proof files by email.
      </Section>
      <Section title="Information kept on your device">
        Guest plans, mission steps, reflections, feedback, rewards, and proof-file references are stored on your device. Proof photos and videos are not uploaded by the RISE beta. Optional faith or belief preferences use protected device storage in the native app and session-only memory on the website.
      </Section>
      <Section title="Information processed for an account">
        If you create an account, RISE processes your email address, display name, a protected password hash, email-verification status, selected goals and skills, schedule preferences, mission and quiz activity, focused minutes, progress scores, and membership status. This information is used to provide sign-in, account recovery, progress syncing, personalization, and support.
      </Section>
      <Section title="Optional analytics and comparison">
        Usage analytics is off by default. If you opt in, RISE records signup duration and approximate foreground-use duration with your progress events so the operator can improve onboarding and missions. Turning it off removes past signup and app-session timing events. Community comparison is separate and off by default; if enabled, RISE calculates your rank from mission counts and focused minutes without publishing your email or proof.
      </Section>
      <Section title="Permissions">
        RISE requests photo, camera, microphone, or notification access only when you use a related feature. You can deny or change these permissions in device settings. Notifications are optional on-device reminders and are not guaranteed to arrive.
      </Section>
      <Section title="Service providers and external links">
        Hosting, database, and transactional-email providers process account information only to operate RISE once the production service is enabled. YouTube, Google Maps, and other resources open outside RISE and follow their own privacy policies. RISE does not sell personal information or use an advertising SDK in this beta.
      </Section>
      <Section title="Security and retention">
        RISE uses short-lived access tokens, revocable refresh sessions, protected password hashes, input limits, and encrypted HTTPS connections in production. No service can promise absolute security. Account data is kept while the account is active and is deleted from the active service when you use in-app account deletion, except where a limited record must be retained for security or legal obligations. Backup deletion follows the hosting provider’s backup cycle.
      </Section>
      <Section title="Your choices">
        Settings lets you export your local and synced account information, turn optional analytics and comparison on or off, delete local data, and delete your account. You may also contact support to request access, correction, or deletion help. Withdrawing an optional choice does not block the core app.
      </Section>
      <Section title="Age and safety">
        RISE is intended for people age 13 and older and is not offered in Apple’s Kids Category. It does not knowingly offer accounts to children who cannot provide valid consent in their region. A parent or guardian should contact support if they believe a child supplied information without appropriate consent.
      </Section>
      <Section title="Changes">
        RISE may update this policy when features, providers, or laws change. The effective date above will change, and material changes will be explained in the app or through another appropriate notice before they take effect.
      </Section>

      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(SUPPORT_MAILTO)} style={styles.contactButton}>
        <Text style={styles.contactText}>Contact privacy support</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/support" as never)} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Open Support Center</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{width:"100%",maxWidth:760,alignSelf:"center",padding:22,paddingTop:45,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900",marginTop:9},updated:{color:"#7A9B8A",fontSize:11,lineHeight:17,marginTop:8},intro:{color:"#D4EBDD",fontSize:15,lineHeight:23,marginTop:18,marginBottom:24},
  card:{backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:17,marginBottom:11},cardTitle:{color:"#F5FFF9",fontSize:15,fontWeight:"900",marginBottom:7},cardText:{color:"#BBD8C8",fontSize:13,lineHeight:20},
  contactButton:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:12},contactText:{color:"#010807",fontSize:14,fontWeight:"900"},secondaryButton:{height:54,borderRadius:27,borderWidth:1,borderColor:"#315845",alignItems:"center",justifyContent:"center",marginTop:10},secondaryText:{color:"#CFF7DF",fontSize:13,fontWeight:"900"},
});
