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

Use TestFlight 1.0.0 (30) once Apple has processed it. The supplied welcome JPEG is an older Build 24 reference; do not relabel it. Capture Today with a personalized sample mission, an action step, the saved-win screen, Learn and Progress. Keep original resolution and avoid personal email, private reflections and notifications. Confirm the build number in TestFlight. Capture again if the final submitted binary changes. Upload listing images under the iOS version's App Previews and Screenshots section, rather than as TestFlight feedback.
