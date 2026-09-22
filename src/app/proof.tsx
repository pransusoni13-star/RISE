import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

import {
  addXP,
  addSkillXP,
  RISEProgress,
  progressRepository,
} from "../services/progressEngine";
import { MissionFeedback, missionRepository } from "../services/missionRepository";
import { createSevenDayPlan, loadProfile, PersonalizedMission, updateProfile } from "../services/personalization";
import { ProofAssetDetails, reviewProof, validateProofAsset } from "../services/proofValidation";
import { recordProgressEvent } from "../services/auth";

export default function ProofScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const taskTitle =
    typeof params.task === "string"
      ? params.task
      : "Today's Task";

  const skillId =
    typeof params.skillId === "string"
      ? params.skillId
      : "practical-skills";

  const goal =
    typeof params.goal === "string"
      ? params.goal.trim().toLowerCase().replace(/\s+/g, "-")
      : "personal";
  const missionId = typeof params.missionId === "string" ? params.missionId : `${goal}:${taskTitle}`;
  const missionContext = typeof params.missionContext === "string" ? params.missionContext : `${taskTitle} ${goal}`;

  const [proofType, setProofType] = useState<
    "photo" | "video" | null
  >(null);
  const [assetUri, setAssetUri] = useState("");
  const [assetDetails, setAssetDetails] = useState<ProofAssetDetails | null>(null);
  const [reflection, setReflection] = useState(typeof params.reflection === "string" ? params.reflection : "");
  const [proofDescription, setProofDescription] = useState("");
  const [matchesMission, setMatchesMission] = useState(false);
  const [ownsWork, setOwnsWork] = useState(false);
  const [nextMission, setNextMission] = useState<PersonalizedMission | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [coins, setCoins] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [difficultyFeedback, setDifficultyFeedback] = useState<MissionFeedback["difficulty"]>();
  const [usefulFeedback, setUsefulFeedback] = useState<boolean>();
  const [blockerFeedback, setBlockerFeedback] = useState<MissionFeedback["blocker"]>();
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  useEffect(() => {
    missionRepository.get(missionId).then((record) => {
      if (!reflection && record.reflection) setReflection(record.reflection);
    });
  }, [missionId, reflection]);

  const proofReview = useMemo(() => reviewProof({
    asset: assetDetails,
    reflection,
    proofDescription,
    missionContext,
    matchesMission,
    ownsWork,
  }), [assetDetails, reflection, proofDescription, missionContext, matchesMission, ownsWork]);

  /*
   * A deterministic source makes proof rewards idempotent.
   *
   * This means:
   * - submitting the same proof twice does NOT give XP twice
   * - navigating away and returning does NOT allow another reward
   * - the progress system remains safe
   */
  const rewardSource = useMemo(() => {
    return `proof:${missionId}`;
  }, [missionId]);

  const acceptPickedAsset = (asset: ImagePicker.ImagePickerAsset, type: "photo" | "video") => {
    const details: ProofAssetDetails = {
      type,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileSize: asset.fileSize,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    };
    const restriction = validateProofAsset(details);
    if (!restriction.allowed) {
      setPickerError(restriction.reason);
      Alert.alert("Attachment not supported", restriction.reason);
      return;
    }

    setProofType(type);
    setAssetUri(asset.uri);
    setAssetDetails(details);
  };

  const attachFromLibrary = async () => {
    if (saving || submitted || pickerBusy) return;
    setPickerBusy(true);
    setPickerError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPickerError("Photo access is off. Enable it in your phone Settings, then try again.");
        Alert.alert("Allow photo access", "Open your phone Settings, select RISE, and allow photo access.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset?.uri) {
        const type = asset.type === "video" ? "video" : "photo";
        acceptPickedAsset(asset, type);
      }
    } catch (error) {
      console.warn("Proof library picker failed", error);
      setPickerError("Your library did not open. Reload RISE and check photo permission.");
      Alert.alert("Attachment did not open", "Reload RISE and try again. If access was denied, enable Photos in your phone Settings.");
    } finally {
      setPickerBusy(false);
    }
  };

  const captureProof = async (type: "photo" | "video") => {
    if (saving || submitted || pickerBusy) return;
    setPickerBusy(true);
    setPickerError("");
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPickerError("Camera access is off. Enable it in your phone Settings, then try again.");
        Alert.alert("Allow camera access", "Open your phone Settings, select RISE, and allow camera access.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === "video" ? ["videos"] : ["images"],
        quality: 0.8,
        videoMaxDuration: 60,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset?.uri) {
        acceptPickedAsset(asset, type);
      }
    } catch (error) {
      console.warn("Proof camera failed", error);
      setPickerError("The camera did not open. Reload RISE and check camera permission.");
      Alert.alert("Camera did not open", "Reload RISE and try again. You can also attach a saved screenshot or video.");
    } finally {
      setPickerBusy(false);
    }
  };

  const chooseCameraMode = () => {
    Alert.alert("Capture proof", "What would you like to create?", [
      { text: "Cancel", style: "cancel" },
      { text: "Take photo", onPress: () => void captureProof("photo") },
      { text: "Record video", onPress: () => void captureProof("video") },
    ]);
  };

  const saveProofProgress = async (
    xp: number,
    coinReward: number,
    title: string
  ) => {
    let progress: RISEProgress =
      await progressRepository.load();

    /*
     * Prevent duplicate proof rewards.
     *
     * We search the existing event history for this exact
     * proof reward source.
     */
    const alreadyRewarded = progress.events.some(
      (event) =>
        event.type === "proof" &&
        event.metadata?.source === rewardSource
    );

    if (alreadyRewarded) {
      setEarnedXP(0);
      setCoins(0);
      return;
    }

    progress = addXP(
      progress,
      xp,
      "proof",
      title,
      coinReward,
      {
        goal,
        skillId,
        source: rewardSource,
        passed: true,
      }
    );

    progress = addSkillXP(
      progress,
      skillId,
      xp,
      goal
    );

    await progressRepository.save(progress);

    setEarnedXP(xp);
    setCoins(coinReward);
  };

  const submitProof = async () => {
    if (!proofType || !assetUri) {
      Alert.alert(
        "Add proof",
        "Choose a photo or record a video first."
      );
      return;
    }

    if (!proofReview.passed) {
      const missing = proofReview.checks.filter((check) => !check.passed).map((check) => check.label).join(", ");
      Alert.alert("Proof needs another look", `Finish these checks before the next mission: ${missing}.`);
      return;
    }

    if (saving || submitted) {
      return;
    }

    setSaving(true);

    try {
      const parsedReward = Number(
        typeof params.reward === "string"
          ? params.reward
          : "50"
      );

      const signedReward =
        Number.isFinite(parsedReward) && parsedReward > 0
          ? parsedReward
          : 50;

      /*
       * Photo:
       *   60% of the base reward as XP
       *   20 Coins
       *
       * Video:
       *   60% of the base reward as XP
       *   25 Coins
       */
      const parsedCoins = Number(typeof params.coins === "string" ? params.coins : "15");
      const coinReward = Number.isFinite(parsedCoins) && parsedCoins > 0 ? parsedCoins : 15;

      const xpReward = signedReward;

      await saveProofProgress(
        xpReward,
        coinReward,
        `Proof submitted: ${taskTitle}`
      );
      const submittedAt = new Date().toISOString();
      await missionRepository.patch(missionId, {
        status: "completed",
        reflection,
        proof: { uri: assetUri, type: proofType, missionId, submittedAt, description: proofDescription.trim(), review: proofReview },
        completedAt: submittedAt,
      });
      const missionMinutes = Number(typeof params.duration === "string" ? params.duration : "0");
      await recordProgressEvent({
        clientEventId: `mission:${missionId}`,
        eventType: "mission_completed",
        skillSlug: skillId.trim().toLowerCase().replace(/\s+/g, "-"),
        minutes: Number.isFinite(missionMinutes) ? missionMinutes : 0,
        metadata: { goal, proofType, completedAt: submittedAt },
      }).catch(() => undefined);
      const profile = await loadProfile();
      const plan = createSevenDayPlan(profile);
      const index = plan.findIndex((mission) => mission.id === missionId);
      setNextMission(index >= 0 ? plan[index + 1] || null : plan[0] || null);
      setSubmitted(true);
    } catch (error) {
      console.log(
        "Failed to save proof reward:",
        error
      );

      Alert.alert(
        "Could not save progress",
        "Your proof could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveFeedback = async (changes: Partial<MissionFeedback>) => {
    if (feedbackSaving) return;
    const difficulty = changes.difficulty ?? difficultyFeedback;
    const useful = changes.useful ?? usefulFeedback;
    const blocker = changes.blocker ?? blockerFeedback;
    setDifficultyFeedback(difficulty);
    setUsefulFeedback(useful);
    setBlockerFeedback(blocker);
    setFeedbackSaving(true);
    try {
      const feedback: MissionFeedback = {
        difficulty,
        useful,
        blocker,
        submittedAt: new Date().toISOString(),
      };
      await missionRepository.patch(missionId, { feedback });
      const currentProfile = await loadProfile();
      const nextProfile = await updateProfile({
        lastDifficultyFeedback: difficulty,
        lastMissionUseful: useful,
        lastBlocker: blocker,
        feedbackCount: (currentProfile.feedbackCount || 0) + (!difficultyFeedback && difficulty ? 1 : 0),
      });
      const plan = createSevenDayPlan(nextProfile);
      const index = plan.findIndex((mission) => mission.id === missionId);
      setNextMission(index >= 0 ? plan[index + 1] || null : plan[0] || null);
    } catch {
      Alert.alert("Feedback was not saved", "Your mission is complete. You can continue and try feedback again later.");
    } finally {
      setFeedbackSaving(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>
              ✓
            </Text>
          </View>

          <Text style={styles.successTitle}>
            You did it.
          </Text>

          <Text style={styles.successSubtitle}>
            {taskTitle} completed.
          </Text>

          {earnedXP > 0 ? (
            <View style={styles.xpCard}>
              <Text style={styles.xpEmoji}>
                ⚡
              </Text>

              <View style={styles.xpContent}>
                <Text style={styles.xpAmount}>
                  +{earnedXP} XP
                </Text>

                <Text style={styles.xpText}>
                  Your progress has been updated.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.xpCard}>
              <Text style={styles.xpEmoji}>
                ✓
              </Text>

              <View style={styles.xpContent}>
                <Text style={styles.xpAmount}>
                  Already rewarded
                </Text>

                <Text style={styles.xpText}>
                  This proof has already been counted.
                </Text>
              </View>
            </View>
          )}

          {coins > 0 && (
            <View style={styles.coinCard}>
              <Text style={styles.coinEmoji}>
                🪙
              </Text>

              <View style={styles.coinContent}>
                <Text style={styles.coinAmount}>
                  +{coins} RISE Coins
                </Text>

                <Text style={styles.coinText}>
                  Keep building your momentum.
                </Text>
              </View>
            </View>
          )}

          {proofType && (
            <View style={styles.verifiedCard}>
              <Text style={styles.verifiedIcon}>
                {proofType === "video"
                  ? "🎥"
                  : "📸"}
              </Text>

              <View style={styles.verifiedContent}>
                <Text style={styles.verifiedTitle}>
                  Proof checks passed
                </Text>

                <Text style={styles.verifiedText}>
                  Attachment, mission match, ownership, and reflection are ready.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackEyebrow}>OPTIONAL · PERSONALIZE THE NEXT MISSION</Text>
            <Text style={styles.feedbackTitle}>How did this feel?</Text>
            <View style={styles.feedbackRow}>
              {([
                ["too_easy", "Too easy"],
                ["right", "Right level"],
                ["too_hard", "Too hard"],
              ] as const).map(([value, label]) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: difficultyFeedback === value }}
                  key={value}
                  onPress={() => void saveFeedback({ difficulty: value })}
                  style={[styles.feedbackChip, difficultyFeedback === value && styles.feedbackChipActive]}
                ><Text style={[styles.feedbackChipText, difficultyFeedback === value && styles.feedbackChipTextActive]}>{label}</Text></Pressable>
              ))}
            </View>
            <Text style={styles.feedbackQuestion}>Was it useful?</Text>
            <View style={styles.feedbackRow}>
              <Pressable onPress={() => void saveFeedback({ useful: true })} style={[styles.feedbackChip, usefulFeedback === true && styles.feedbackChipActive]}><Text style={[styles.feedbackChipText, usefulFeedback === true && styles.feedbackChipTextActive]}>Yes</Text></Pressable>
              <Pressable onPress={() => void saveFeedback({ useful: false })} style={[styles.feedbackChip, usefulFeedback === false && styles.feedbackChipActive]}><Text style={[styles.feedbackChipText, usefulFeedback === false && styles.feedbackChipTextActive]}>Not yet</Text></Pressable>
            </View>
            {(difficultyFeedback === "too_hard" || usefulFeedback === false) ? <>
              <Text style={styles.feedbackQuestion}>What got in the way?</Text>
              <View style={styles.feedbackRow}>
                {([[
                  "time", "Time"], ["instructions", "Clarity"], ["tools", "Tools"], ["confidence", "Confidence"], ["none", "Nothing"]] as const).map(([value, label]) => (
                  <Pressable key={value} onPress={() => void saveFeedback({ blocker: value })} style={[styles.feedbackChip, blockerFeedback === value && styles.feedbackChipActive]}><Text style={[styles.feedbackChipText, blockerFeedback === value && styles.feedbackChipTextActive]}>{label}</Text></Pressable>
                ))}
              </View>
            </> : null}
            {feedbackSaving ? <Text style={styles.feedbackSaving}>Saving your preference...</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a photo, screenshot, or video from this phone"
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => nextMission
              ? router.replace({ pathname: "/action", params: { mission: JSON.stringify(nextMission) } } as any)
              : void loadProfile().then((profile) => router.replace({ pathname: "/quiz", params: { cycleGate: "1", cycleId: missionId, skillId: profile.weeklySkill || skillId, goal: profile.selectedGoals[0] || goal, goals: JSON.stringify(profile.selectedGoals), commitment: profile.commitment || "Every 7 days" } } as any))}
          >
            <Text style={styles.continueButtonText}>
              {nextMission ? "Start Next Mission" : "Take Cycle Quiz to Unlock"}
            </Text>

            <Text style={styles.arrow}>
              →
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use the camera for mission proof"
            style={styles.todayButton}
            onPress={() =>
              router.push("/progress-screen" as any)
            }
          >
            <Text style={styles.todayButtonText}>
              View My Progress
            </Text>
          </Pressable>

        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={saving}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          RISE PROOF
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>
          🔥
        </Text>

        <Text style={styles.title}>
          Prove your{"\n"}
          <Text style={styles.greenText}>
            progress.
          </Text>
        </Text>

        <Text style={styles.subtitle}>
          You did the work. Now show RISE.
          Submit a photo or video and earn
          extra RISE Coins.
        </Text>

        <View style={styles.taskCard}>
          <Text style={styles.taskLabel}>
            TODAY’S TASK
          </Text>

          <Text style={styles.taskTitle}>
            {taskTitle}
          </Text>
        </View>

        <View style={styles.xpInfoCard}>
          <View style={styles.xpInfoIcon}>
            <Text style={styles.xpInfoEmoji}>
              ⚡
            </Text>
          </View>

          <View style={styles.xpInfoContent}>
            <Text style={styles.xpInfoTitle}>
              Proof = progress
            </Text>

            <Text style={styles.xpInfoText}>
              Submit proof to earn XP and
              develop your skill.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Choose your proof
        </Text>

        <View style={styles.options}>
          <Pressable
            onPress={attachFromLibrary}
            style={({ pressed }) => [
              styles.optionCard,
              proofType === "photo" &&
                styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            disabled={saving || pickerBusy}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>
                📸
              </Text>
            </View>

            <Text style={styles.optionTitle}>
              Choose from phone
            </Text>

            <Text style={styles.optionDescription}>
              Photo, screenshot, or video
            </Text>

            <Text style={styles.reward}>
              Private on this device
            </Text>
          </Pressable>

          <Pressable
            onPress={chooseCameraMode}
            style={({ pressed }) => [
              styles.optionCard,
              proofType === "video" &&
                styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            disabled={saving || pickerBusy}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>
                🎥
              </Text>
            </View>

            <Text style={styles.optionTitle}>
              Use camera
            </Text>

            <Text style={styles.optionDescription}>
              Take a photo or record video
            </Text>

            <Text style={styles.reward}>
              Up to 60 seconds
            </Text>
          </Pressable>
        </View>

        {pickerBusy ? (
          <View style={styles.pickerStatus}>
            <ActivityIndicator color="#7AF5B8" />
            <Text style={styles.pickerStatusText}>Opening your phone...</Text>
          </View>
        ) : null}
        {pickerError ? <Text style={styles.errorText}>{pickerError}</Text> : null}

        {proofType && assetUri ? (
          <View style={styles.selectedProof}>
            <Text style={styles.selectedCheck}>
              ✓
            </Text>

            <Text style={styles.selectedText}>
              {proofType === "video"
                ? "Video attached and ready"
                : "Screenshot or photo attached and ready"}
            </Text>
            {proofType === "photo" ? <Image accessible accessibilityLabel="Selected mission proof preview" source={{ uri: assetUri }} style={styles.preview} /> : null}
            <Pressable onPress={() => { setProofType(null); setAssetUri(""); setAssetDetails(null); setMatchesMission(false); setOwnsWork(false); }}>
              <Text style={styles.replaceText}>Remove or replace</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewEyebrow}>PROOF REVIEW</Text>
          <Text style={styles.reviewTitle}>Show how this proves the mission</Text>
          <Text style={styles.reviewText}>In one specific sentence, describe what is visible and how it connects to “{taskTitle}.”</Text>
          <TextInput
            value={proofDescription}
            onChangeText={setProofDescription}
            placeholder="Example: This screenshot shows the working React Native form and the error state I added."
            placeholderTextColor="#668577"
            multiline
            maxLength={500}
            style={styles.reviewInput}
          />
          <ReviewCheck checked={matchesMission} onPress={() => setMatchesMission((value) => !value)} text="The attachment clearly shows the result of this mission." />
          <ReviewCheck checked={ownsWork} onPress={() => setOwnsWork((value) => !value)} text="I created this work or have permission to submit it." />
          <View style={styles.reviewList}>{proofReview.checks.map((check) => <View key={check.id} style={styles.reviewRow}><Text style={[styles.reviewMark, check.passed && styles.reviewMarkPassed]}>{check.passed ? "✓" : "○"}</Text><View style={styles.reviewBody}><Text style={[styles.reviewCheckTitle, check.passed && styles.reviewCheckPassed]}>{check.label}</Text><Text style={styles.reviewCheckDetail}>{check.detail}</Text></View></View>)}</View>
          <Text style={styles.localNote}>RISE performs local consistency checks. It does not use biometric recognition or claim that an image is independently authenticated.</Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
      <View style={[styles.footer, { marginBottom: insets.bottom + 8 }]}>
        <Pressable
          onPress={submitProof}
          style={({ pressed }) => [
            styles.submitButton,
            (!proofReview.passed || saving || pickerBusy) &&
              styles.submitButtonDisabled,
            pressed &&
              proofType &&
              !saving &&
              styles.buttonPressed,
          ]}
          disabled={!proofReview.passed || saving || pickerBusy}
        >
          <Text style={styles.submitText}>
            {saving
              ? "Saving..."
              : proofReview.passed ? "Submit Reviewed Proof" : `Finish ${proofReview.checks.filter((check) => !check.passed).length} Proof Checks`}
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.requiredText}>
          Proof stays on this device in this version of RISE.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewCheck({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={[styles.attestation, checked && styles.attestationChecked]}><View style={[styles.checkBox, checked && styles.checkBoxChecked]}><Text style={styles.checkBoxText}>{checked ? "✓" : ""}</Text></View><Text style={styles.attestationText}>{text}</Text></Pressable>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },

  header: {
    minHeight: 68,
    flexShrink: 0,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#010807",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#071B16",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  backText: {
    fontSize: 30,
    color: "#7AF5B8",
    marginTop: -4,
  },

  headerTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#7AF5B8",
  },

  headerSpace: {
    width: 42,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 155,
  },

  emoji: {
    fontSize: 34,
    marginBottom: 15,
  },

  title: {
    fontSize: 39,
    lineHeight: 43,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 14,
  },

  greenText: {
    color: "#7AF5B8",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#C8EED9",
    marginBottom: 22,
  },

  taskCard: {
    backgroundColor: "#071B16",
    borderRadius: 20,
    padding: 19,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  taskLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#B4D4C2",
    marginBottom: 7,
  },

  taskTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5FFF9",
  },

  xpInfoCard: {
    backgroundColor: "#11382B",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  xpInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#071B16",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  xpInfoEmoji: {
    fontSize: 21,
  },

  xpInfoContent: {
    flex: 1,
  },

  xpInfoTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 3,
  },

  xpInfoText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#C8EED9",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 12,
  },

  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  optionCard: {
    width: "48%",
    backgroundColor: "#071B16",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#1E3A31",
    marginBottom: 2,
  },

  optionSelected: {
    borderColor: "#7AF5B8",
    backgroundColor: "#11382B",
  },

  optionPressed: {
    opacity: 0.7,
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#11382B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  optionEmoji: {
    fontSize: 24,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 5,
  },

  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "#C8EED9",
    minHeight: 35,
  },

  reward: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7AF5B8",
    marginTop: 10,
  },

  selectedProof: {
    marginTop: 15,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#11382B",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  selectedCheck: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#7AF5B8",
    color: "#010807",
    textAlign: "center",
    lineHeight: 23,
    fontWeight: "900",
    marginRight: 9,
  },

  selectedText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F5FFF9",
    flex: 1,
  },
  preview: { width: "100%", height: 180, borderRadius: 12, marginTop: 12, backgroundColor: "#071B16" },
  replaceText: { color: "#7AF5B8", fontSize: 12, fontWeight: "800", marginTop: 10 },
  pickerStatus: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  pickerStatusText: { color: "#BBD8C8", fontSize: 13, fontWeight: "700" },
  errorText: { color: "#FFB4A8", fontSize: 12, lineHeight: 18, marginTop: 12 },
  reviewCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: "#071B16", borderWidth: 1, borderColor: "#29483B" },
  reviewEyebrow: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  reviewTitle: { color: "#F5FFF9", fontSize: 18, fontWeight: "900", marginTop: 7 },
  reviewText: { color: "#A7CBB7", fontSize: 12, lineHeight: 18, marginTop: 6 },
  reviewInput: { minHeight: 84, borderRadius: 14, borderWidth: 1, borderColor: "#29483B", backgroundColor: "#010807", color: "#F5FFF9", padding: 13, marginTop: 12, marginBottom: 11, textAlignVertical: "top", fontSize: 13, lineHeight: 19 },
  attestation: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  attestationChecked: { opacity: 1 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: "#527263", alignItems: "center", justifyContent: "center", marginRight: 10 },
  checkBoxChecked: { backgroundColor: "#7AF5B8", borderColor: "#7AF5B8" },
  checkBoxText: { color: "#010807", fontWeight: "900" },
  attestationText: { color: "#DFFDEE", fontSize: 12, lineHeight: 18, flex: 1 },
  reviewList: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#1E3A31", paddingTop: 9 },
  reviewRow: { flexDirection: "row", paddingVertical: 6 },
  reviewMark: { color: "#6E9581", width: 24, fontWeight: "900" },
  reviewMarkPassed: { color: "#7AF5B8" },
  reviewBody: { flex: 1 },
  reviewCheckTitle: { color: "#BBD8C8", fontSize: 12, fontWeight: "800" },
  reviewCheckPassed: { color: "#7AF5B8" },
  reviewCheckDetail: { color: "#789886", fontSize: 10, lineHeight: 15, marginTop: 2 },
  localNote: { color: "#6E9581", fontSize: 9, lineHeight: 14, marginTop: 11 },

  bottomSpace: {
    height: 30,
  },

  submitButton: {
    height: 58,
    borderRadius: 30,
    backgroundColor: "#010807",
    borderWidth: 2,
    borderColor: "#7AF5B8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonDisabled: {
    backgroundColor: "#1B2B26",
    borderColor: "#4D665D",
  },

  submitText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#7AF5B8",
  },

  arrow: {
    fontSize: 22,
    color: "#7AF5B8",
    marginLeft: 10,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  skipButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },

  skipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B4D4C2",
  },

  requiredText: {
    color: "#8FB6A2",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  footer: {
    marginHorizontal: 18,
    flexShrink: 0,
    padding: 10,
    borderRadius: 28,
    backgroundColor: "rgba(1,8,7,0.96)",
  },

  successContainer: {
    flex: 1,
    backgroundColor: "#010807",
  },

  successContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 50,
  },

  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#7AF5B8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  successCheck: {
    fontSize: 48,
    color: "#010807",
    fontWeight: "900",
  },

  successTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 8,
  },

  successSubtitle: {
    fontSize: 16,
    color: "#C8EED9",
    marginBottom: 30,
    textAlign: "center",
  },

  xpCard: {
    width: "100%",
    backgroundColor: "#11382B",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  xpEmoji: {
    fontSize: 35,
    marginRight: 15,
  },

  xpContent: {
    flex: 1,
  },

  xpAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#7AF5B8",
  },

  xpText: {
    fontSize: 12,
    color: "#C8EED9",
    marginTop: 3,
  },

  coinCard: {
    width: "100%",
    backgroundColor: "#071B16",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  coinEmoji: {
    fontSize: 35,
    marginRight: 15,
  },

  coinContent: {
    flex: 1,
  },

  coinAmount: {
    fontSize: 19,
    fontWeight: "900",
    color: "#F5FFF9",
  },

  coinText: {
    fontSize: 12,
    color: "#C8EED9",
    marginTop: 3,
  },

  verifiedCard: {
    width: "100%",
    backgroundColor: "#071B16",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  verifiedIcon: {
    fontSize: 28,
    marginRight: 13,
  },

  verifiedContent: {
    flex: 1,
  },

  verifiedTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7AF5B8",
  },

  verifiedText: {
    fontSize: 12,
    color: "#C8EED9",
    marginTop: 3,
  },
  feedbackCard: { width: "100%", backgroundColor: "#071B16", borderRadius: 20, padding: 17, borderWidth: 1, borderColor: "#1E3A31", marginBottom: 18 },
  feedbackEyebrow: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  feedbackTitle: { color: "#F5FFF9", fontSize: 18, fontWeight: "900", marginTop: 7, marginBottom: 11 },
  feedbackQuestion: { color: "#BBD8C8", fontSize: 12, fontWeight: "800", marginTop: 13, marginBottom: 8 },
  feedbackRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  feedbackChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: "#36594A", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  feedbackChipActive: { backgroundColor: "#7AF5B8", borderColor: "#7AF5B8" },
  feedbackChipText: { color: "#C8EED9", fontSize: 11, fontWeight: "800" },
  feedbackChipTextActive: { color: "#010807" },
  feedbackSaving: { color: "#8FB6A2", fontSize: 11, marginTop: 10 },

  continueButton: {
    width: "100%",
    height: 58,
    borderRadius: 30,
    backgroundColor: "#010807",
    borderWidth: 2,
    borderColor: "#7AF5B8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonText: {
    color: "#7AF5B8",
    fontSize: 17,
    fontWeight: "900",
  },

  todayButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },

  todayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B4D4C2",
  },
});
