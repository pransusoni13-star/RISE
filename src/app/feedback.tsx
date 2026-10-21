import React, { useEffect, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { feedbackRepository, ProductFeedback } from "../services/feedbackRepository";
import { getCurrentUser, getPublicConfig, RiseUser, submitProductFeedback } from "../services/auth";
import { useRiseAppearance } from "../services/appearance";

const categories: [ProductFeedback["category"], string][] = [
  ["idea", "Idea"], ["bug", "Something broke"], ["confusing", "Confusing"], ["mission", "Mission quality"], ["accessibility", "Accessibility"],
];

type DeliveryReceipt = { tone: "success" | "warning" | "local"; title: string; detail: string };

export default function FeedbackScreen() {
  const { theme } = useRiseAppearance();
  const [category, setCategory] = useState<ProductFeedback["category"]>("idea");
  const [rating, setRating] = useState<ProductFeedback["rating"]>(5);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [user, setUser] = useState<RiseUser | null>(null);
  const [emailReady, setEmailReady] = useState(false);
  const [receipt, setReceipt] = useState<DeliveryReceipt | null>(null);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState("");
  const [pendingFeedback, setPendingFeedback] = useState<ProductFeedback | null>(null);
  const valid = message.trim().length >= 5;

  useEffect(() => {
    let active = true;
    void Promise.all([getCurrentUser().catch(() => null), getPublicConfig(), feedbackRepository.list()]).then(([currentUser, config, savedFeedback]) => {
      if (!active) return;
      setUser(currentUser);
      setEmailReady(config.email_delivery_ready);
      if (currentUser?.display_name) setFirstName(currentUser.display_name.trim().split(/\s+/)[0]);
      const pending = savedFeedback.find((item) => item.deliveryStatus === "pending");
      if (pending) {
        setPendingFeedback(pending);
        setCategory(pending.category);
        setRating(pending.rating);
        setMessage(pending.message);
        setReceipt({ tone: "local", title: "Unsent feedback restored", detail: "Your earlier note is still private on this phone. Tap Send to retry safely." });
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const submittedMessage = message.trim();
      setLastSubmittedMessage(submittedMessage);
      const saved = pendingFeedback
        ? await feedbackRepository.updatePending(pendingFeedback.id, { category, rating, message: submittedMessage }) ?? pendingFeedback
        : await feedbackRepository.add({ category, rating, message: submittedMessage });
      setPendingFeedback(saved);
      const result = await submitProductFeedback({ clientFeedbackId: saved.id, category: saved.category, rating: saved.rating, message: saved.message, appVersion: saved.appVersion }).catch(() => ({ received: false, emailNotified: false }));
      await feedbackRepository.markDelivery(saved.id, result.emailNotified ? "emailed" : result.received ? "received" : "pending");
      if (result.received) { setMessage(""); setPendingFeedback(null); }
      const thanks = firstName ? `Thank you, ${firstName}.` : "Thank you for helping improve RISE.";
      if (result.received && result.emailNotified) {
        setReceipt({ tone: "success", title: "Delivered privately", detail: `${thanks} RISE stored your note and notified the private RISE inbox.` });
      } else if (result.received) {
        setReceipt({ tone: "warning", title: "Saved to your RISE account", detail: `${thanks} The inbox alert was not confirmed. Your note is still stored privately.` });
      } else {
        setReceipt({ tone: "local", title: "Saved on this phone only", detail: "RISE could not confirm server delivery. Your note was not posted publicly or shared with another app." });
      }
    } catch {
      Alert.alert("Could not save feedback", "Please try again.");
    } finally { setSaving(false); }
  };

  const openEmailDraft = async () => {
    const subject = encodeURIComponent("RISE beta feedback");
    const feedbackText = message.trim() || lastSubmittedMessage;
    const body = encodeURIComponent(feedbackText ? `Feedback for RISE:\n\n${feedbackText}` : "Feedback for RISE:\n\n");
    const url = `mailto:rise.app13@gmail.com?subject=${subject}&body=${body}`;
    try {
      if (!(await Linking.canOpenURL(url))) throw new Error("No email app");
      await Linking.openURL(url);
    } catch {
      Alert.alert("No email app found", "Email rise.app13@gmail.com from your preferred mail app.");
    }
  };

  return <KeyboardAvoidingView style={[styles.page, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.back, { borderColor: theme.border }]}><Text style={[styles.backText, { color: theme.accent }]}>‹</Text></Pressable>
      <Text style={[styles.eyebrow, { color: theme.accent }]}>BUILD RISE WITH US</Text>
      <Text style={[styles.title, { color: theme.text }]}>Make the next version better.</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Tell us what happened and what you expected. One clear note is enough.</Text>

      <View style={[styles.deliveryCard, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
        <View style={[styles.deliveryDot, { backgroundColor: user && emailReady ? theme.accent : theme.muted }]} />
        <View style={styles.deliveryBody}><Text style={[styles.deliveryTitle, { color: theme.text }]}>{!user ? "Sign in to email feedback" : emailReady ? "Private delivery is ready" : "Email delivery needs attention"}</Text><Text style={[styles.deliveryText, { color: theme.muted }]}>{!user ? "Guest feedback stays safely on this phone." : emailReady ? "RISE will store this note and notify rise.app13@gmail.com." : "Your note will be stored in your RISE account, but the inbox alert may be delayed."}</Text></View>
      </View>
      {!user ? <Pressable accessibilityRole="button" onPress={() => router.push("/account" as never)} style={[styles.signInButton, { borderColor: theme.border }]}><Text style={[styles.signInText, { color: theme.text }]}>Sign in to send privately →</Text></Pressable> : null}
      {receipt ? <View accessibilityRole="summary" style={[styles.receipt, { backgroundColor: theme.surface, borderColor: receipt.tone === "success" ? theme.accent : theme.border }]}><Text style={[styles.receiptTitle, { color: theme.text }]}>{receipt.title}</Text><Text style={[styles.receiptText, { color: theme.muted }]}>{receipt.detail}</Text></View> : null}

      <Text style={[styles.label, { color: theme.muted }]}>WHAT IS THIS ABOUT?</Text>
      <View style={styles.chips}>{categories.map(([value, label]) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: category === value }} key={value} onPress={() => setCategory(value)} style={[styles.chip, { borderColor: theme.border }, category === value && { backgroundColor: theme.accent, borderColor: theme.accent }]}><Text style={[styles.chipText, { color: theme.text }, category === value && { color: theme.accentInk }]}>{label}</Text></Pressable>)}</View>

      <Text style={[styles.label, { color: theme.muted }]}>HOW DID IT FEEL?</Text>
      <View style={styles.rating}>{([1,2,3,4,5] as const).map((value) => <Pressable accessibilityRole="radio" accessibilityLabel={`${value} out of 5`} accessibilityState={{ selected: rating === value }} key={value} onPress={() => setRating(value)} style={[styles.ratingButton, { borderColor: theme.border }, rating === value && { backgroundColor: theme.accent, borderColor: theme.accent }]}><Text style={[styles.ratingText, { color: theme.text }, rating === value && { color: theme.accentInk }]}>{value}</Text></Pressable>)}</View>

      <Text style={[styles.label, { color: theme.muted }]}>WHAT HAPPENED?</Text>
      <TextInput value={message} onChangeText={setMessage} multiline maxLength={1000} returnKeyType="done" blurOnSubmit onSubmitEditing={() => Keyboard.dismiss()} placeholder="Example: I finished the mission, but could not find where to replace my proof video." placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} />
      <Text style={[styles.count, { color: theme.muted }]}>{message.length} / 1000</Text>
      <Text style={[styles.safety, { color: theme.muted }]}>Never include passwords, health records, client information, or private proof files.</Text>
      {(receipt ? receipt.tone !== "success" : !emailReady) ? <View style={styles.emailFallback}><Pressable accessibilityRole="button" accessibilityLabel="Open an email draft to RISE" onPress={() => void openEmailDraft()} style={[styles.emailButton, { borderColor: theme.border }]}><Text style={[styles.emailButtonText, { color: theme.text }]}>Open an email draft instead →</Text></Pressable><Text style={[styles.emailNote, { color: theme.muted }]}>This opens your mail app. Review the note and tap Send yourself.</Text></View> : null}
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: theme.background }]}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving }} disabled={!valid || saving} onPress={submit} style={[styles.button, { backgroundColor: theme.accent }, (!valid || saving) && styles.disabled]}><Text style={[styles.buttonText, { color: theme.accentInk }]}>{saving ? "Saving…" : user ? "Send privately to RISE →" : "Save privately on this phone →"}</Text></Pressable><Text style={[styles.privacy, { color: theme.muted }]}>{user ? emailReady ? "Stored in your account and emailed to the private RISE inbox." : "Stored in your account; use the email draft if the inbox alert is unavailable." : "Sign in first if you want this sent to the RISE team."}</Text></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page:{flex:1},content:{padding:22,paddingTop:45,paddingBottom:175},back:{width:42,height:42,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center",marginBottom:25},backText:{fontSize:30,marginTop:-4},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{fontSize:34,lineHeight:40,fontWeight:"900",marginTop:9},subtitle:{fontSize:14,lineHeight:21,marginTop:10,marginBottom:17},deliveryCard:{minHeight:78,borderRadius:18,borderWidth:1,padding:14,flexDirection:"row",alignItems:"center",marginBottom:10},deliveryDot:{width:10,height:10,borderRadius:5,marginRight:12},deliveryBody:{flex:1},deliveryTitle:{fontSize:13,fontWeight:"900"},deliveryText:{fontSize:11,lineHeight:17,marginTop:3},signInButton:{minHeight:46,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center",marginBottom:18},signInText:{fontSize:12,fontWeight:"900"},receipt:{borderWidth:1,borderRadius:16,padding:14,marginBottom:16},receiptTitle:{fontSize:13,fontWeight:"900"},receiptText:{fontSize:11,lineHeight:17,marginTop:4},label:{fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:10,marginTop:9},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:20},chip:{minHeight:42,borderRadius:14,borderWidth:1,paddingHorizontal:13,alignItems:"center",justifyContent:"center"},chipText:{fontSize:11,fontWeight:"800"},rating:{flexDirection:"row",gap:9,marginBottom:22},ratingButton:{width:48,height:48,borderRadius:16,borderWidth:1,alignItems:"center",justifyContent:"center"},ratingText:{fontWeight:"900"},input:{minHeight:150,borderRadius:18,borderWidth:1,padding:15,textAlignVertical:"top",fontSize:14,lineHeight:21},count:{fontSize:10,textAlign:"right",marginTop:7},safety:{fontSize:10,lineHeight:16,marginTop:8},emailFallback:{marginTop:14},emailButton:{minHeight:48,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center"},emailButtonText:{fontSize:12,fontWeight:"900"},emailNote:{fontSize:9,lineHeight:14,textAlign:"center",marginTop:6},footer:{position:"absolute",left:18,right:18,bottom:12,borderRadius:22,padding:10},button:{height:56,borderRadius:15,alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},buttonText:{fontSize:14,fontWeight:"900"},privacy:{fontSize:9,lineHeight:14,textAlign:"center",marginTop:7},
});
