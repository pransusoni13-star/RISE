import React from "react";
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from "react-native";
import {router} from "expo-router";
import {useRiseAppearance} from "../services/appearance";

export function LoadFailure({title = "Your saved work needs another try", onRetry}: {title?:string; onRetry?:()=>void}) {
  const {theme} = useRiseAppearance();
  return <View style={[styles.page,{backgroundColor:theme.background}]}>
    <Text accessibilityRole="header" style={[styles.title,{color:theme.text}]}>{title}</Text>
    <Text accessibilityRole="alert" style={[styles.body,{color:theme.muted}]}>RISE could not read the saved data. It has not replaced it with a new plan or zero progress.</Text>
    <Pressable accessibilityRole="button" onPress={onRetry || (()=>router.replace("/(tabs)/today" as never))} style={[styles.button,{backgroundColor:theme.accent}]}><Text style={[styles.buttonText,{color:theme.accentInk}]}>{onRetry ? "Try again" : "Return to Today"}</Text></Pressable>
  </View>;
}

export function LoadPending() {
  const {theme}=useRiseAppearance();
  return <View style={[styles.page,{backgroundColor:theme.background}]}><ActivityIndicator color={theme.accent} /><Text accessibilityLiveRegion="polite" style={[styles.body,{color:theme.muted,textAlign:"center"}]}>Opening your saved work…</Text></View>;
}

const styles=StyleSheet.create({
  page:{flex:1,justifyContent:"center",padding:28},
  title:{fontSize:25,fontWeight:"800",lineHeight:32},
  body:{fontSize:16,lineHeight:24,marginTop:12},
  button:{minHeight:50,justifyContent:"center",alignItems:"center",paddingHorizontal:18,paddingVertical:14,borderRadius:14,marginTop:24},
  buttonText:{fontSize:16,fontWeight:"800",textAlign:"center"},
});
