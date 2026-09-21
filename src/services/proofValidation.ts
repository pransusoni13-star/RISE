export type ProofAssetDetails = {
  type: "photo" | "video";
  uri: string;
  width?: number;
  height?: number;
  duration?: number | null;
  fileSize?: number;
  fileName?: string | null;
  mimeType?: string | null;
};

export type ProofReview = {
  passed: boolean;
  checkedAt: string;
  checks: { id: string; label: string; passed: boolean; detail: string }[];
};

const stopWords = new Set([
  "about", "after", "again", "build", "complete", "create", "daily", "finish",
  "from", "learn", "mission", "progress", "result", "show", "skill", "today",
  "using", "with", "work", "your",
]);

const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]);
const PHOTO_EXTENSION = /\.(jpe?g|png|webp|heic|heif)$/i;
const VIDEO_EXTENSION = /\.(mp4|mov|webm|m4v)$/i;

export function validateProofAsset(asset: ProofAssetDetails): { allowed: boolean; reason: string } {
  const maxBytes = asset.type === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (asset.fileSize != null && asset.fileSize > maxBytes) {
    return {
      allowed: false,
      reason: `${asset.type === "video" ? "Video" : "Photo"} must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    };
  }

  const mimeType = asset.mimeType?.toLowerCase();
  const allowedMimeTypes = asset.type === "video" ? VIDEO_MIME_TYPES : PHOTO_MIME_TYPES;
  if (mimeType && !allowedMimeTypes.has(mimeType)) {
    return { allowed: false, reason: "Choose a standard photo, screenshot, or video file." };
  }

  const fileName = asset.fileName?.trim();
  const allowedExtension = asset.type === "video" ? VIDEO_EXTENSION : PHOTO_EXTENSION;
  if (fileName && !allowedExtension.test(fileName)) {
    return { allowed: false, reason: "This file extension is not supported for mission proof." };
  }

  return { allowed: true, reason: "File type and size are supported." };
}

export function reflectionQuality(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  const words = text ? text.split(" ").filter(Boolean) : [];
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const substantialSentences = sentences.filter(
    (sentence) => sentence.split(/\s+/).filter(Boolean).length >= 4
  );
  const passed =
    sentences.length >= 2 &&
    sentences.length <= 3 &&
    substantialSentences.length === sentences.length &&
    words.length >= 18;

  return {
    passed,
    sentenceCount: sentences.length,
    wordCount: words.length,
    message: passed
      ? `${sentences.length} clear sentences · ${words.length} words`
      : sentences.length < 2
        ? "Write at least 2 complete sentences."
        : sentences.length > 3
          ? "Keep this reflection focused to 2–3 sentences."
          : words.length < 18
            ? `Add more detail (${words.length}/18 words).`
            : "Make each sentence explain a complete idea.",
  };
}

function missionKeywords(context: string): string[] {
  return Array.from(
    new Set(
      context
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !stopWords.has(word))
    )
  );
}

export function reviewProof(input: {
  asset?: ProofAssetDetails | null;
  reflection: string;
  proofDescription: string;
  missionContext: string;
  matchesMission: boolean;
  ownsWork: boolean;
}): ProofReview {
  const reflection = reflectionQuality(input.reflection);
  const descriptionWords = input.proofDescription.trim().split(/\s+/).filter(Boolean);
  const keywords = missionKeywords(input.missionContext);
  const description = input.proofDescription.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => description.includes(keyword));
  const asset = input.asset;
  const assetRestriction = asset ? validateProofAsset(asset) : null;
  const usableAsset = !!asset?.uri && assetRestriction?.allowed === true && (
    asset.type === "video"
      ? (asset.duration == null || (asset.duration >= 2000 && asset.duration <= 60000))
      : (asset.width == null || asset.width >= 200) && (asset.height == null || asset.height >= 200)
  );
  const meaningfulFile = asset?.fileSize == null || asset.fileSize >= 10_000;
  const contextMatch = descriptionWords.length >= 8 && (
    matchedKeywords.length > 0 || keywords.length === 0
  );

  const checks: ProofReview["checks"] = [
    {
      id: "attachment",
      label: "Usable attachment",
      passed: usableAsset && meaningfulFile,
      detail: asset?.type === "video"
        ? assetRestriction?.allowed === false ? assetRestriction.reason : "Video must be usable and no longer than 60 seconds."
        : assetRestriction?.allowed === false ? assetRestriction.reason : "Photo or screenshot must be large enough to review.",
    },
    {
      id: "reflection",
      label: "2–3 sentence reflection",
      passed: reflection.passed,
      detail: reflection.message,
    },
    {
      id: "match",
      label: "Evidence matches this mission",
      passed: contextMatch && input.matchesMission,
      detail: contextMatch
        ? "Your explanation connects the attachment to this mission."
        : "Use at least 8 words and name something specific from this mission.",
    },
    {
      id: "ownership",
      label: "Original or permitted work",
      passed: input.ownsWork,
      detail: "Only submit work you created or have permission to use.",
    },
  ];

  return {
    passed: checks.every((check) => check.passed),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
