import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function AccountScreen() {
  return <View style={styles.page}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.logo}>RISE</Text><Text style={styles.eyebrow}>PRIVATE BETA ACCESS</Text>
    <Text style={styles.title}>Your progress should belong to <Text style={styles.green}>you.</Text></Text>
    <Text style={styles.subtitle}>A secure account will sync missions, badges, proof status, and your access plan across devices.</Text>
    <View style={styles.offer}><Text style={styles.offerLabel}>BETA OFFER</Text><Text style={styles.offerTitle}>Claim 3 months free</Text><Text style={styles.offerText}>No payment is collected in this private beta. Final price, renewal date, and cancellation terms must be shown before any future purchase.</Text></View>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={[styles.googleButton, styles.disabled]}><Text style={styles.googleIcon}>G</Text><Text style={styles.googleText}>Continue with Google</Text></Pressable>
    <Text style={styles.setupText}>Google sign-in is waiting for the production OAuth client and secure account backend. RISE will not simulate a login or store fake credentials.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push("/onboarding" as any)} style={styles.betaButton}><Text style={styles.betaText}>Continue Private Beta on This Device →</Text></Pressable>
    <View style={styles.waitlist}><Text style={styles.waitlistTitle}>On the original waitlist?</Text><Text style={styles.waitlistText}>The first 50 verified accounts can receive a one-year promotional entitlement after secure sign-in is connected. Eligibility must be assigned on the server—not by an editable button in the app.</Text></View>
    <Text style={styles.legal}>By continuing, you can review RISE’s beta privacy and safety terms before creating your plan. This screen does not start a paid subscription.</Text>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:24,paddingTop:54,paddingBottom:60},logo:{color:"#7AF5B8",fontSize:22,fontWeight:"900",letterSpacing:6,marginBottom:42},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:40,lineHeight:46,fontWeight:"900",marginTop:11},green:{color:"#7AF5B8"},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:23,marginTop:13,marginBottom:24},offer:{backgroundColor:"#071B16",borderWidth:1,borderColor:"#29483B",borderRadius:20,padding:18,marginBottom:18},offerLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},offerTitle:{color:"#F5FFF9",fontSize:22,fontWeight:"900",marginTop:7},offerText:{color:"#9FC3AF",fontSize:12,lineHeight:19,marginTop:7},googleButton:{height:58,borderRadius:29,backgroundColor:"#F5FFF9",flexDirection:"row",alignItems:"center",justifyContent:"center"},disabled:{opacity:.45},googleIcon:{color:"#2563EB",fontSize:18,fontWeight:"900",marginRight:12},googleText:{color:"#0B1712",fontSize:14,fontWeight:"900"},setupText:{color:"#789886",fontSize:10,lineHeight:16,textAlign:"center",marginTop:10,marginHorizontal:9},betaButton:{minHeight:56,borderRadius:28,borderWidth:1,borderColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:18},betaText:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},waitlist:{backgroundColor:"rgba(255,207,112,0.06)",borderWidth:1,borderColor:"rgba(255,207,112,0.22)",borderRadius:17,padding:15,marginTop:20},waitlistTitle:{color:"#FFCF70",fontSize:13,fontWeight:"900"},waitlistText:{color:"#E9DFC3",fontSize:11,lineHeight:18,marginTop:5},legal:{color:"#668577",fontSize:9,lineHeight:15,textAlign:"center",marginTop:18},
});
