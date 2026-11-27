# App Store screenshots

Capture screenshots from the exact processed iOS build on a physical iPhone or
an Apple-supported simulator. Do not use web mockups as the submitted product
screenshots.

1. Copy `manifest.example.json` to `manifest.json`.
2. Add the screenshot files to this directory.
3. Record every required display-size set and its repository-relative files.
4. Set `capturedFromExactBuild` to `true` only after confirming the build number
   visible in App Store Connect matches the manifest.

The release gate checks that every listed image exists, is non-empty, uses PNG
or JPEG, has an Apple-accepted iPhone pixel size, has no PNG alpha/transparency,
and belongs to the same build as `app.json`. It also requires at least one
current Dynamic Island medium screenshot. Recheck Apple's live
[screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
before every release because accepted devices and sizes can change.

## Current capture request

Use the final installed Build 25 for the iOS 27 candidate. The supplied welcome JPEG is confirmed by the owner as Build 24 and is retained unchanged for reference. Do not relabel it as Build 25. Capture Today with its personalized mission, the mission instructions, Plan, Projects, and Progress, using fictional sample data and no visible account email. Keep original resolution and avoid cropping, compression, or notifications. Capture again if the final submitted binary changes. Upload listing images in App Store Connect under the iOS version’s App Previews and Screenshots section, rather than as TestFlight feedback.
