import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { claimFoundingMembership, getCurrentUser, getPublicConfig, isApiConfigured, login, register, RiseUser } from "../services/auth";

export default function AccountScreen() {
  const [mode, setMode] = useState<"create" | "login">("create");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [foundingCode, setFoundingCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [existingUser, setExistingUser] = useState<RiseUser | null>(null);
  const [foundingOpen, setFoundingOpen] = useState(false);
  const [usageAnalyticsOptIn, setUsageAnalyticsOptIn] = useState(false);
  const signupStartedAt = useRef(0);

  useEffect(() => {
    signupStartedAt.current = Date.now();
    void getCurrentUser().then(setExistingUser).finally(() => setCheckingSession(false));
    void getPublicConfig().then((value) => setFoundingOpen(value.founding_redemption_enabled));
  }, []);
  const valid = /.+@.+\..+/.test(email.trim()) && password.length >= (mode === "create" ? 10 : 1) && (mode === "login" || displayName.trim().length >= 2);

  const submit = async () => {
    if (!valid || busy) return;
    Keyboard.dismiss(); setBusy(true); setError("");
    try {
      const user = mode === "create" ? await register({ email, password, displayName, foundingCode: foundingOpen ? foundingCode : undefined, usageAnalyticsOptIn, signupElapsedSeconds: usageAnalyticsOptIn && signupStartedAt.current ? Math.min(3600, Math.max(0, Math.round((Date.now() - signupStartedAt.current) / 1000))) : undefined }) : await login(email, password);
      setExistingUser(user);
      router.replace(mode === "create" ? "/popular-skills" as never : "/(tabs)/today" as never);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "RISE could not complete sign in.");
    } finally { setBusy(false); }
  };

  const claim = async () => {
    if (!foundingCode.trim() || busy) return;
    setBusy(true); setError("");
    try { setExistingUser(await claimFoundingMembership(foundingCode)); setFoundingCode(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not claim founding access."); }
    finally { setBusy(false); }
  };

  if (checkingSession) {
    return <View style={styles.loadingPage}><View style={styles.brandMark}><Text style={styles.brandLetter}>R</Text></View><ActivityIndicator color="#7DE2AD" /><Text style={styles.loadingText}>Getting your space ready…</Text></View>;
  }

  if (existingUser) {
    return <View style={styles.page}><ScrollView contentContainerStyle={styles.content}>
      <Brand /><Text style={styles.eyebrow}>GOOD TO SEE YOU</Text><Text style={styles.title}>Ready for your next small win, {firstName(existingUser.display_name)}?</Text>
      <Text style={styles.subtitle}>Your plan is waiting. Pick up where you left off or explore a fresh skill.</Text>
      {existingUser.is_founding_member ? <View style={styles.founderCard}><View style={styles.founderTop}><Text style={styles.founderLabel}>FOUNDING MEMBER</Text><Text style={styles.founderBadge}>FIRST 60</Text></View><Text style={styles.founderTitle}>You helped RISE begin.</Text><Text style={styles.founderText}>Your complimentary founding year is connected to {existingUser.email}{existingUser.founding_expires_at ? ` until ${new Date(existingUser.founding_expires_at).toLocaleDateString()}` : ""}.</Text></View> : null}
      {foundingOpen && !existingUser.is_founding_member ? <View style={styles.founderCard}><Text style={styles.founderLabel}>WAITLIST MEMBER?</Text><Text style={styles.founderTitle}>Claim your founding year.</Text><Text style={styles.founderText}>Enter the code sent to {existingUser.email}. It works only for that email.</Text><TextInput accessibilityLabel="Founding member code" value={foundingCode} onChangeText={setFoundingCode} autoCapitalize="none" autoCorrect={false} placeholder="Your founding code" placeholderTextColor="#668577" style={styles.founderInput} /><Pressable accessibilityRole="button" disabled={!foundingCode.trim() || busy} onPress={() => void claim()} style={styles.secondaryButton}><Text style={styles.secondaryText}>{busy ? "Checking…" : "Claim founding access"}</Text></Pressable></View> : null}
      {error ? <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" onPress={() => router.replace("/(tabs)/today" as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Continue my plan</Text><Text style={styles.buttonArrow}>→</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/popular-skills" as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Explore popular skills</Text></Pressable>
    </ScrollView></View>;
  }

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Brand /><Text style={styles.eyebrow}>{mode === "create" ? "A BETTER 1% STARTS HERE" : "WELCOME BACK"}</Text>
      <Text style={styles.title}>{mode === "create" ? "Build skills that move your life forward." : "Keep your momentum going."}</Text>
      <Text style={styles.subtitle}>{mode === "create" ? "Tell us where you want to grow. RISE turns it into small, useful missions made for your schedule." : "Sign in to continue your missions, streaks, and progress."}</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "create" }} onPress={() => { setMode("create"); setError(""); }} style={[styles.tab, mode === "create" && styles.tabActive]}><Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>Create account</Text></Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "login" }} onPress={() => { setMode("login"); setError(""); }} style={[styles.tab, mode === "login" && styles.tabActive]}><Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Sign in</Text></Pressable>
      </View>
      {!isApiConfigured() ? <View style={styles.errorCard}><Text style={styles.errorText}>Accounts are unavailable in this build. The publisher must connect RISE to its public HTTPS account service. You can still continue without an account.</Text></View> : null}
      {mode === "create" ? <Field label="YOUR NAME" value={displayName} onChangeText={setDisplayName} placeholder="What should RISE call you?" maxLength={80} autoComplete="name" /> : null}
      <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="you@example.com" maxLength={320} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder={mode === "create" ? "At least 10 characters" : "Your password"} maxLength={128} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={mode === "create" ? "new-password" : "current-password"} accessory={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} hitSlop={12} onPress={() => setShowPassword((value) => !value)}><Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text></Pressable>} hint={mode === "create" ? "Use 10+ characters. A short phrase is easier to remember." : undefined} />
      {mode === "create" ? <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: usageAnalyticsOptIn }} onPress={() => setUsageAnalyticsOptIn((value) => !value)} style={styles.consentRow}><Text style={styles.consentCheck}>{usageAnalyticsOptIn ? "☑" : "☐"}</Text><Text style={styles.consentText}>Optional: share account-linked mission activity, signup time, and time spent in RISE to help improve the beta. Change this in Settings.</Text></Pressable> : null}
      {mode === "create" && foundingOpen ? <View style={styles.founderCard}><Text style={styles.founderLabel}>FIRST 60 WAITLIST MEMBERS</Text><Text style={styles.founderTitle}>Claim your founding year.</Text><Text style={styles.founderText}>Use the one-time code sent privately to the same email address. Codes cannot be transferred or reused.</Text><TextInput accessibilityLabel="Founding member code" value={foundingCode} onChangeText={setFoundingCode} maxLength={128} autoCapitalize="none" autoCorrect={false} placeholder="Optional founding code" placeholderTextColor="#668577" style={styles.founderInput} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} /></View> : null}
      {error ? <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || busy || !isApiConfigured() }} disabled={!valid || busy || !isApiConfigured()} onPress={() => void submit()} style={({ pressed }) => [styles.primaryButton, (!valid || busy || !isApiConfigured()) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{busy ? "Setting things up…" : mode === "create" ? "Create my account" : "Sign in"}</Text>{!busy ? <Text style={styles.buttonArrow}>→</Text> : null}</Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/onboarding" as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Continue without an account</Text></Pressable>
      <Text style={styles.guestHint}>Your plan works on this device. Create an account later if you want to sync progress.</Text>
      <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)} style={styles.policyLink}><Text style={styles.policyText}>Privacy, Safety & Terms</Text></Pressable>
      <Text style={styles.legal}>No payment collected · Delete or export data in Settings</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Brand() { return <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandLetter}>R</Text></View><Text style={styles.logo}>RISE</Text><View style={styles.beta}><Text style={styles.betaText}>BETA</Text></View></View>; }
function firstName(name: string) { return name.trim().split(/\s+/)[0] || "there"; }

function Field(props: React.ComponentProps<typeof TextInput> & { label: string; hint?: string; accessory?: React.ReactNode }) {
  const { label, hint, accessory, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputShell}><TextInput {...inputProps} accessibilityLabel={label} placeholderTextColor="#64756E" style={styles.input} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />{accessory ? <View style={styles.accessory}>{accessory}</View> : null}</View>{hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  consentRow:{flexDirection:"row",alignItems:"flex-start",gap:10,marginBottom:16,padding:10,borderRadius:10,borderWidth:1,borderColor:"#2A3A32"},consentCheck:{color:"#7DE2AD",fontSize:21,lineHeight:24},consentText:{color:"#AEBDB5",fontSize:11,lineHeight:17,flex:1},
  page:{flex:1,backgroundColor:"#07110D"},loadingPage:{flex:1,backgroundColor:"#07110D",alignItems:"center",justifyContent:"center",gap:14},loadingText:{color:"#92A49B",fontSize:13},content:{width:"100%",maxWidth:560,alignSelf:"center",padding:24,paddingTop:48,paddingBottom:60},brand:{flexDirection:"row",alignItems:"center",marginBottom:38},brandMark:{width:32,height:32,borderRadius:10,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center",marginBottom:0},brandLetter:{color:"#07110D",fontSize:16,fontWeight:"900"},logo:{color:"#F6F8F5",fontSize:16,fontWeight:"800",letterSpacing:3,marginLeft:10},beta:{borderWidth:1,borderColor:"#314039",borderRadius:6,paddingHorizontal:6,paddingVertical:3,marginLeft:8},betaText:{color:"#84968D",fontSize:8,fontWeight:"800",letterSpacing:.8},eyebrow:{color:"#7DE2AD",fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:"#F6F8F5",fontSize:36,lineHeight:43,fontWeight:"700",letterSpacing:-.8,marginTop:11},subtitle:{color:"#AEBDB5",fontSize:15,lineHeight:23,marginTop:12,marginBottom:26},tabs:{flexDirection:"row",backgroundColor:"#0D1914",borderWidth:1,borderColor:"#1F2D27",borderRadius:12,padding:4,marginBottom:22},tab:{flex:1,minHeight:42,borderRadius:9,alignItems:"center",justifyContent:"center"},tabActive:{backgroundColor:"#1B2C24"},tabText:{color:"#788A81",fontSize:12,fontWeight:"700"},tabTextActive:{color:"#EAF4EE"},field:{marginBottom:17},fieldLabel:{color:"#B7C5BE",fontSize:11,fontWeight:"700",marginBottom:8},inputShell:{height:54,borderRadius:12,borderWidth:1,borderColor:"#2A3A32",backgroundColor:"#0B1712",flexDirection:"row",alignItems:"center"},input:{height:52,color:"#F6F8F5",paddingHorizontal:15,fontSize:14,flex:1},accessory:{paddingRight:15},showText:{color:"#7DE2AD",fontSize:12,fontWeight:"700"},fieldHint:{color:"#71837A",fontSize:10,lineHeight:16,marginTop:6},founderCard:{backgroundColor:"#17170F",borderWidth:1,borderColor:"#3B3923",borderRadius:16,padding:17,marginVertical:7,marginBottom:20},founderTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},founderLabel:{color:"#E5C76B",fontSize:9,fontWeight:"800",letterSpacing:1.2},founderBadge:{color:"#9D9061",fontSize:9,fontWeight:"700"},founderTitle:{color:"#FFF9E8",fontSize:17,fontWeight:"700",marginTop:7},founderText:{color:"#BDB69C",fontSize:12,lineHeight:18,marginTop:6},founderInput:{height:48,borderRadius:11,borderWidth:1,borderColor:"#4A472E",backgroundColor:"#0C1511",color:"#F5FFF9",paddingHorizontal:13,fontSize:13,marginTop:13},errorCard:{backgroundColor:"#241412",borderWidth:1,borderColor:"#5B302C",borderRadius:12,padding:13,marginBottom:15},errorText:{color:"#FFB5AA",fontSize:12,lineHeight:18},primaryButton:{minHeight:56,borderRadius:12,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:10,marginTop:4},pressed:{opacity:.82,transform:[{scale:.995}]},disabled:{opacity:.36},primaryText:{color:"#07110D",fontSize:14,fontWeight:"800"},buttonArrow:{color:"#07110D",fontSize:18,fontWeight:"700"},secondaryButton:{height:52,borderRadius:12,borderWidth:1,borderColor:"#34483E",alignItems:"center",justifyContent:"center",marginTop:11},secondaryText:{color:"#CEE2D6",fontSize:13,fontWeight:"700"},guestHint:{color:"#71837A",fontSize:10,lineHeight:16,textAlign:"center",marginTop:8},policyLink:{minHeight:46,alignItems:"center",justifyContent:"center",marginTop:8},policyText:{color:"#A9C9B8",fontSize:11,fontWeight:"700"},legal:{color:"#6F8077",fontSize:9,lineHeight:15,textAlign:"center",marginTop:4},
});
