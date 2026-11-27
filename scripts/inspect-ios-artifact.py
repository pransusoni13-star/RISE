"""Inspect an owned IPA without installing it or executing its contents.

This is static evidence, not Apple signature verification or a native pentest.
Writes only selected metadata and printable binary strings to a local audit folder.
"""
import argparse
import hashlib
import json
import plistlib
import re
from pathlib import Path
from zipfile import ZipFile


def inspect(ipa: Path, output: Path) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    problems = []
    manifests = []
    entitlements = None
    string_index = []
    next_line = 1
    strings_path = output / "artifact-strings.txt"
    with ZipFile(ipa) as archive, strings_path.open("wb") as strings:
        infos = [name for name in archive.namelist() if re.fullmatch(r"Payload/[^/]+\.app/Info\.plist", name)]
        if len(infos) != 1:
            raise ValueError("Expected one main application Info.plist")
        root = infos[0].removesuffix("Info.plist")
        info = plistlib.loads(archive.read(infos[0]))
        expo = plistlib.loads(archive.read(root + "Expo.plist")) if root + "Expo.plist" in archive.namelist() else {}
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            if entry.file_size > 150 * 1024 * 1024:
                problems.append(f"File too large for bounded static inspection: {entry.filename}")
                continue
            data = archive.read(entry)
            # No archive paths are extracted or executed.
            first_line = next_line
            for chunk in re.findall(rb"[\x20-\x7e]{8,}", data):
                strings.write(chunk + b"\n")
                next_line += 1
            string_index.append({"file": entry.filename, "first": first_line, "last": next_line - 1})
            if entry.filename.endswith("PrivacyInfo.xcprivacy"):
                manifest = plistlib.loads(data)
                manifests.append({"file": entry.filename, "tracking": manifest.get("NSPrivacyTracking", False),
                                  "tracking_domains": manifest.get("NSPrivacyTrackingDomains", []),
                                  "accessed_apis": manifest.get("NSPrivacyAccessedAPITypes", [])})
            if entry.filename == root + "embedded.mobileprovision":
                start, end = data.find(b"<?xml"), data.find(b"</plist>")
                if start >= 0 and end >= 0:
                    profile = plistlib.loads(data[start:end + len(b"</plist>")])
                    entitlements = profile.get("Entitlements", {})
            if entry.filename.lower().endswith((".p8", ".p12", ".key", "/.env")):
                problems.append("Unexpected credential-file extension inside artifact")
        if info.get("CFBundleIdentifier") != "com.riseapp13.riseapp":
            problems.append("Unexpected bundle identifier")
        if info.get("NSAppTransportSecurity", {}).get("NSAllowsArbitraryLoads", False):
            problems.append("Arbitrary network transport is enabled")
        if info.get("UIFileSharingEnabled", False):
            problems.append("Application documents are exposed through file sharing")
        if entitlements is None:
            problems.append("Provisioning-profile entitlements could not be inspected")
        elif entitlements.get("get-task-allow", False):
            problems.append("Debug entitlement is enabled")
        if any(m["tracking"] or m["tracking_domains"] for m in manifests):
            problems.append("A bundled privacy manifest declares tracking; review the release label")
    report = {
        "sha256": hashlib.file_digest(ipa.open("rb"), "sha256").hexdigest(),
        "bundle_id": info.get("CFBundleIdentifier"), "version": info.get("CFBundleShortVersionString"),
        "build": info.get("CFBundleVersion"), "minimum_os": info.get("MinimumOSVersion"),
        "sdk": info.get("DTSDKName"), "xcode_build": info.get("DTXcodeBuild"),
        "permission_keys": sorted(k for k in info if k.endswith("UsageDescription")),
        "background_modes": info.get("UIBackgroundModes", []),
        "file_sharing_enabled": info.get("UIFileSharingEnabled", False),
        "debug_entitlement": entitlements.get("get-task-allow") if entitlements else None,
        "updates_url": expo.get("EXUpdatesURL"), "runtime_version": expo.get("EXUpdatesRuntimeVersion"),
        "privacy_manifests": manifests, "problems": sorted(set(problems)),
        "limitations": ["No cryptographic code-signature verification on Windows", "No runtime, sandbox, backup, or media-decoder testing", "Secret scanning is a separate pattern-based step"],
    }
    (output / "artifact-report.json").write_text(json.dumps(report, indent=2) + "\n")
    (output / "artifact-string-index.json").write_text(json.dumps(string_index) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("ipa", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = inspect(args.ipa, args.output)
    print(json.dumps({k: v for k, v in result.items() if k != "privacy_manifests"}, indent=2))
    raise SystemExit(bool(result["problems"]))
