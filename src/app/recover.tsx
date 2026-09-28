import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { confirmPasswordReset, requestPasswordReset } from "../services/auth";

export default function RecoverScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(typeof params.token === "string" ? params.token : "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const resetting = Boolean(token);

  const submit = async () => {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      if (resetting) {
        if (password.length < 10) throw new Error("Use at least 10 characters for your new password.");
        await confirmPasswordReset(token, password);
        setMessage("Password changed. Refresh sessions are revoked; already-open sessions expire within 15 minutes. Sign in with your new password.");
      } else {
        if (!/.+@.+\..+/.test(email.trim())) throw new Error("Enter a valid email address.");
        setMessage(await requestPasswordReset(email));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "RISE could not complete that request."); }
    finally { setBusy(false); }
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text><Text style={styles.title}>{resetting ? "Choose a new password." : "Get back into RISE."}</Text>
    <Text style={styles.subtitle}>{resetting ? "This one-time link expires after 30 minutes. Resetting revokes refresh sessions; already-open sessions expire within 15 minutes." : "Enter your account email. For privacy, RISE gives the same response whether an account exists or not."}</Text>
    {!resetting ? <Field label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /> : <><Field label="RESET CODE" value={token} onChangeText={setToken} autoCapitalize="none" /><Field label="NEW PASSWORD" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" /></>}
    {message ? <View accessibilityRole="alert" style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View> : null}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={[styles.button, busy && {opacity:.5}]}><Text style={styles.buttonText}>{busy ? "Please wait…" : resetting ? "Reset password" : "Send reset instructions"}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.replace("/account" as never)} style={styles.link}><Text style={styles.linkText}>Return to sign in</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const {label,...rest}=props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...rest} accessibilityLabel={label} placeholderTextColor="#64756E" style={styles.input} /></View>; }
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#07110D"},content:{width:"100%",maxWidth:560,alignSelf:"center",padding:24,paddingTop:48,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:30},backText:{color:"#7DE2AD",fontSize:30,marginTop:-4},eyebrow:{color:"#7DE2AD",fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:"#F6F8F5",fontSize:36,lineHeight:43,fontWeight:"700",marginTop:10},subtitle:{color:"#AEBDB5",fontSize:14,lineHeight:22,marginTop:12,marginBottom:26},field:{marginBottom:17},label:{color:"#B7C5BE",fontSize:11,fontWeight:"700",marginBottom:8},input:{height:54,borderRadius:12,borderWidth:1,borderColor:"#2A3A32",backgroundColor:"#0B1712",color:"#F6F8F5",paddingHorizontal:15,fontSize:14},notice:{backgroundColor:"#10241B",borderWidth:1,borderColor:"#315845",borderRadius:12,padding:13,marginBottom:15},noticeText:{color:"#D9F6E6",fontSize:12,lineHeight:18},button:{height:56,borderRadius:12,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center"},buttonText:{color:"#07110D",fontSize:14,fontWeight:"800"},link:{height:50,alignItems:"center",justifyContent:"center"},linkText:{color:"#A9C9B8",fontSize:12,fontWeight:"700"}});
