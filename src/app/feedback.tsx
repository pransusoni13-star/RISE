import React, { useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { feedbackRepository, ProductFeedback } from "../services/feedbackRepository";

const categories: [ProductFeedback["category"], string][] = [
  ["idea", "Idea"], ["bug", "Something broke"], ["confusing", "Confusing"], ["mission", "Mission quality"], ["accessibility", "Accessibility"],
];

export default function FeedbackScreen() {
  const [category, setCategory] = useState<ProductFeedback["category"]>("idea");
  const [rating, setRating] = useState<ProductFeedback["rating"]>(5);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = message.trim().length >= 5;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const saved = await feedbackRepository.add({ category, rating, message: message.trim() });
      await Share.share({
        title: "RISE feedback",
        message: `RISE feedback (${saved.category}, ${saved.rating}/5)\n\n${saved.message}\n\nVersion ${saved.appVersion}`,
      });
      setMessage("");
      Alert.alert("Feedback saved", "A private copy is stored on this device. The share sheet lets you send it through an app you choose.");
    } catch {
      Alert.alert("Could not save feedback", "Please try again.");
    } finally { setSaving(false); }
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
      <Text style={styles.eyebrow}>BUILD RISE WITH US</Text>
      <Text style={styles.title}>What should become better?</Text>
      <Text style={styles.subtitle}>One short note is enough. Do not include passwords, health records, client information, or other private details.</Text>

      <Text style={styles.label}>TYPE OF FEEDBACK</Text>
      <View style={styles.chips}>{categories.map(([value, label]) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: category === value }} key={value} onPress={() => setCategory(value)} style={[styles.chip, category === value && styles.chipActive]}><Text style={[styles.chipText, category === value && styles.chipTextActive]}>{label}</Text></Pressable>)}</View>

      <Text style={styles.label}>HOW IS RISE FEELING?</Text>
      <View style={styles.rating}>{([1,2,3,4,5] as const).map((value) => <Pressable accessibilityRole="radio" accessibilityLabel={`${value} out of 5`} accessibilityState={{ selected: rating === value }} key={value} onPress={() => setRating(value)} style={[styles.ratingButton, rating === value && styles.ratingActive]}><Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>{value}</Text></Pressable>)}</View>

      <Text style={styles.label}>YOUR NOTE</Text>
      <TextInput value={message} onChangeText={setMessage} multiline maxLength={1000} returnKeyType="done" blurOnSubmit onSubmitEditing={() => Keyboard.dismiss()} placeholder="Example: I understood the mission, but I could not find where to replace my proof video." placeholderTextColor="#668577" style={styles.input} />
      <Text style={styles.count}>{message.length} / 1000</Text>
    </ScrollView>
    <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving }} disabled={!valid || saving} onPress={submit} style={[styles.button, (!valid || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? "Saving..." : "Save & Share Feedback →"}</Text></Pressable><Text style={styles.privacy}>Stored locally until you choose where to share it.</Text></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:45,paddingBottom:155},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:25},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:36,lineHeight:42,fontWeight:"900",marginTop:9},subtitle:{color:"#BBD8C8",fontSize:14,lineHeight:22,marginTop:11,marginBottom:25},label:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:10,marginTop:7},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:20},chip:{minHeight:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",paddingHorizontal:13,alignItems:"center",justifyContent:"center"},chipActive:{backgroundColor:"#7AF5B8",borderColor:"#7AF5B8"},chipText:{color:"#C8EED9",fontSize:11,fontWeight:"800"},chipTextActive:{color:"#010807"},rating:{flexDirection:"row",gap:9,marginBottom:22},ratingButton:{width:48,height:48,borderRadius:24,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},ratingActive:{backgroundColor:"#7AF5B8",borderColor:"#7AF5B8"},ratingText:{color:"#C8EED9",fontWeight:"900"},ratingTextActive:{color:"#010807"},input:{minHeight:150,borderRadius:18,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",color:"#F5FFF9",padding:15,textAlignVertical:"top",fontSize:14,lineHeight:21},count:{color:"#6F9883",fontSize:10,textAlign:"right",marginTop:7},footer:{position:"absolute",left:18,right:18,bottom:12,backgroundColor:"rgba(1,8,7,0.97)",borderRadius:28,padding:10},button:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},buttonText:{color:"#010807",fontSize:14,fontWeight:"900"},privacy:{color:"#6F9883",fontSize:9,textAlign:"center",marginTop:7},
});
