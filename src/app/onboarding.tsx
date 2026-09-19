import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { consentRepository } from "../services/consentRepository";

export default function OnboardingScreen() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [limitsConfirmed, setLimitsConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const valid = ageConfirmed && limitsConfirmed;

  const continueNext = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await consentRepository.save();
      router.push("/goals" as any);
    } finally { setSaving(false); }
  };

  return <View style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.top}><Text style={styles.logo}>RISE</Text><Text style={styles.beta}>PRIVATE BETA</Text></View>
      <Text style={styles.eyebrow}>ONE SMALL STEP AT A TIME</Text>
      <Text style={styles.title}>A personal path that learns with you.</Text>
      <Text style={styles.subtitle}>Choose one future direction and one life direction, build three connected skills, and complete clear missions with reviewed proof.</Text>

      <View style={styles.path}>
        <Path number="1" title="Choose two directions" text="One career or learning goal plus one health, life, or personal goal." />
        <Path number="2" title="Get one useful mission" text="Sized to your time, experience, feedback, and trusted sources." />
        <Path number="3" title="Do, prove, improve" text="Attach real work, reflect briefly, and let the next mission adapt." />
      </View>

      <View style={styles.privacy}><Text style={styles.privacyTitle}>Private by default</Text><Text style={styles.privacyText}>This beta stores your profile, proof references, progress, belief preferences, and feedback locally on this device. It has no cloud account or advertising tracker.</Text></View>

      <Check checked={ageConfirmed} onPress={() => setAgeConfirmed((value) => !value)} title="I am 13 or older" text="RISE’s current beta is not designed for children under 13." />
      <Check checked={limitsConfirmed} onPress={() => setLimitsConfirmed((value) => !value)} title="I understand the beta limits" text="RISE provides educational suggestions, not medical, legal, financial, religious, or other professional advice." />

      <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as any)} style={styles.policyLink}><Text style={styles.policyText}>Read Privacy, Safety & Beta Terms →</Text></Pressable>
    </ScrollView>
    <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving }} disabled={!valid || saving} onPress={continueNext} style={[styles.button, (!valid || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? "Saving..." : "Personalize My RISE →"}</Text></Pressable></View>
  </View>;
}

function Path({ number, title, text }: { number: string; title: string; text: string }) {
  return <View style={styles.pathRow}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={styles.pathBody}><Text style={styles.pathTitle}>{title}</Text><Text style={styles.pathText}>{text}</Text></View></View>;
}

function Check({ checked, onPress, title, text }: { checked: boolean; onPress: () => void; title: string; text: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={[styles.check, checked && styles.checkActive]}><View style={[styles.box, checked && styles.boxActive]}><Text style={styles.checkmark}>{checked ? "✓" : ""}</Text></View><View style={styles.pathBody}><Text style={styles.checkTitle}>{title}</Text><Text style={styles.checkText}>{text}</Text></View></Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:40,paddingBottom:145},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:35},logo:{color:"#7AF5B8",fontSize:22,fontWeight:"900",letterSpacing:6},beta:{color:"#8FB6A2",fontSize:9,fontWeight:"900",letterSpacing:1.2},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900",marginTop:11},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:23,marginTop:13,marginBottom:25},path:{backgroundColor:"#071B16",borderRadius:21,borderWidth:1,borderColor:"#1E3A31",padding:16,marginBottom:14},pathRow:{flexDirection:"row",marginBottom:15},number:{width:32,height:32,borderRadius:16,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginRight:12},numberText:{color:"#7AF5B8",fontSize:11,fontWeight:"900"},pathBody:{flex:1},pathTitle:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},pathText:{color:"#8FB6A2",fontSize:11,lineHeight:17,marginTop:4},privacy:{backgroundColor:"rgba(122,245,184,0.07)",borderRadius:17,borderWidth:1,borderColor:"rgba(122,245,184,0.2)",padding:15,marginBottom:18},privacyTitle:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},privacyText:{color:"#C8EED9",fontSize:11,lineHeight:18,marginTop:5},check:{flexDirection:"row",borderRadius:17,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",padding:14,marginBottom:9},checkActive:{borderColor:"#4FA77E",backgroundColor:"#0B281E"},box:{width:24,height:24,borderRadius:7,borderWidth:1,borderColor:"#527263",alignItems:"center",justifyContent:"center",marginRight:11},boxActive:{backgroundColor:"#7AF5B8",borderColor:"#7AF5B8"},checkmark:{color:"#010807",fontWeight:"900"},checkTitle:{color:"#F5FFF9",fontSize:13,fontWeight:"900"},checkText:{color:"#8FB6A2",fontSize:10,lineHeight:16,marginTop:3},policyLink:{alignItems:"center",paddingVertical:12},policyText:{color:"#9FC3AF",fontSize:11,fontWeight:"800"},footer:{position:"absolute",left:18,right:18,bottom:14,padding:10,borderRadius:28,backgroundColor:"rgba(1,8,7,0.97)"},button:{height:58,borderRadius:29,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},buttonText:{color:"#010807",fontSize:15,fontWeight:"900"},
});
