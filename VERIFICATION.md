# Verification — 2026-09-13

- TypeScript: `npm run typecheck` passed.
- Model tests: `npm test`, 6/6 passed (portion scaling, daily isolation, weight replacement, storage roundtrip, corrupt data rejection, calendar boundaries).
- Production bundles: `expo export --platform all` succeeded for web, Android and iOS. This verifies bundling only, not native device execution or signed APK/IPA generation.
- Chrome desktop 1440 × 1000: dashboard render inspected; search for chicken, select grams, save 150 g (247.5 kcal internally), and add 250 ml water exercised.
- Reload: persisted food and water restored.
- Chrome mobile emulation 390 × 844: dashboard render inspected, navigation and modal used; save 68.5 kg and change profile name/calorie goal/target weight exercised.
- Reload: changed profile and 68.5 kg restored; no horizontal page overflow; no browser console warnings/errors.
- QA uses separate Chrome storage contexts; the user's preview starts with an empty diary.

Limitations: no physical Android/iOS device test, no signed native installer, no verified external nutrition database, no cloud sync. See README.md.
