import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { confirmEmailVerification } from "../services/auth";
import { useRiseAppearance } from "../services/appearance";

export default function VerifyEmailScreen() {
  const { theme } = useRiseAppearance();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const validToken = typeof token === "string" && token.length >= 32;
  const [message, setMessage] = useState(validToken ? "Checking your verification link…" : "This verification link is incomplete.");
  const [busy, setBusy] = useState(validToken);
  useEffect(() => {
    if (!validToken || typeof token !== "string") return;
    void confirmEmailVerification(token).then(() => { { setMessage("Email verified. Your RISE account is ready."); router.setParams({ token: undefined }); }; router.setParams({ token: undefined }); }).catch((error) => setMessage(error instanceof Error ? error.message : "This verification link could not be used.")).finally(() => setBusy(false));
  }, [token, validToken]);
  return <View style={[styles.page, { backgroundColor: theme.background }]}><View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.eyebrow, { color: theme.accent }]}>RISE ACCOUNT</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Email verification</Text>{busy ? <ActivityIndicator color={theme.accent} style={styles.spinner} /> : null}<Text accessibilityRole="alert" style={[styles.message, { color: theme.muted }]}>{message}</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/account" as never)} style={[styles.button, { backgroundColor: theme.accent }]}><Text style={[styles.buttonText, { color: theme.accentInk }]}>Return to my account</Text></Pressable></View></View>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#07110D",alignItems:"center",justifyContent:"center",padding:24},card:{width:"100%",maxWidth:520,backgroundColor:"#0B1712",borderWidth:1,borderColor:"#2A3A32",borderRadius:18,padding:24},eyebrow:{color:"#7DE2AD",fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:"#F6F8F5",fontSize:32,fontWeight:"700",marginTop:9},spinner:{marginVertical:22},message:{color:"#B7C5BE",fontSize:14,lineHeight:22,marginVertical:20},button:{height:54,borderRadius:12,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center"},buttonText:{color:"#07110D",fontSize:14,fontWeight:"800"}});
