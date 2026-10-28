import { router } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUPPORT_MAILTO } from "../constants/support";

export default function PrivacyChoicesScreen() {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR PRIVACY CHOICES</Text>
    <Text accessibilityRole="header" style={styles.title}>You stay in control.</Text>
    <Text style={styles.intro}>These controls are available in the beta. Core missions still work when optional analytics, comparison, camera, photos, microphone, and notifications are off.</Text>

    <Choice number="1" title="Export your information" text="Open Settings → Export My RISE Data to create a readable copy of local and synced account records through your device share sheet." />
    <Choice number="2" title="Delete local or account data" text="Open Settings → Delete My RISE Data to erase this device. Signed-in members can choose Delete Account Everywhere to delete the active server account and associated records." />
    <Choice number="3" title="Turn optional sharing off" text="Usage analytics and community comparison are separate and off by default. Signed-in members can change them in Settings and Your Progress. Turning analytics off removes past usage-time and signup-time events." />
    <Choice number="4" title="Control phone permissions" text="RISE asks only when a related feature is used. Change camera, photos, microphone, or notification access in phone Settings. Proof attachments and reflections remain on this device in the beta." />
    <Choice number="5" title="Access, correct, or challenge" text="Use export and plan controls for common requests. Contact privacy support for access, correction, deletion help, consent withdrawal, or a complaint. Never email passwords, tokens, or proof files." />

    <Pressable accessibilityRole="button" onPress={() => router.push("/settings" as never)} style={styles.primaryButton}><Text style={styles.primaryText}>Open RISE Settings</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.secondaryButton}><Text style={styles.secondaryText}>Open phone permissions</Text></Pressable>
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(SUPPORT_MAILTO)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Contact privacy support</Text></Pressable>
    <View style={styles.links}><Pressable accessibilityRole="link" onPress={() => router.push("/privacy" as never)}><Text style={styles.link}>Privacy Policy</Text></Pressable><Text style={styles.dot}>·</Text><Pressable accessibilityRole="link" onPress={() => router.push("/terms" as never)}><Text style={styles.link}>Terms of Use</Text></Pressable></View>
  </ScrollView>;
}

function Choice({ number, title, text }: { number: string; title: string; text: string }) {
  return <View style={styles.card}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={styles.body}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{width:"100%",maxWidth:700,alignSelf:"center",padding:22,paddingTop:45,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900",marginTop:9},intro:{color:"#C8E2D3",fontSize:14,lineHeight:22,marginTop:14,marginBottom:24},
  card:{flexDirection:"row",backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:16,marginBottom:10},number:{width:30,height:30,borderRadius:15,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginRight:12},numberText:{color:"#7AF5B8",fontSize:11,fontWeight:"900"},body:{flex:1},cardTitle:{color:"#F5FFF9",fontSize:15,fontWeight:"900"},cardText:{color:"#AFCFBD",fontSize:12,lineHeight:19,marginTop:5},
  primaryButton:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:"#010807",fontSize:14,fontWeight:"900"},secondaryButton:{height:52,borderRadius:26,borderWidth:1,borderColor:"#315845",alignItems:"center",justifyContent:"center",marginTop:10},secondaryText:{color:"#CFF7DF",fontSize:13,fontWeight:"900"},links:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,marginTop:18},link:{color:"#A7CBB7",fontSize:11,fontWeight:"800",paddingVertical:8},dot:{color:"#527263"},
});
