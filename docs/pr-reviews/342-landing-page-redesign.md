# PR #342 — Landing page redesign review

Posted by Cursor Cloud Agent (GitHub API token cannot create PR review comments; see commit `80785cc` on this branch).

## Summary

Strong redesign: scroll journey, phone mocks, colour-block sections, and good use of `useReducedMotion`. Build passes on this branch.

### Highlights

- Good decomposition (`LandingShell`, `mockRegistry`, `journey` data)
- Interactive clue mocks (`ClueGeoMock` / `ImageCaptureMock`) with cleanup on phase timers
- Clue section tab UI uses `role="tablist"` / `aria-selected` appropriately

### Suggested before merge

1. Remove or wire up unused modules (~560 lines): `HeroScene.tsx`, `Trail.tsx`, `mocks.tsx`, plus unused exports in `AppMocks` / `mockRegistry`
2. Fix the `TeamMock` copy timeout leak
3. Replace the use-case card inline `transform` with Tailwind (frontend conventions)
4. Give `bliss.png` meaningful `alt` text; consider WebP/AVIF for PWA precache (~468KB)

---

## Inline notes

### `frontend/src/components/landing/AppMocks.tsx` (~L196)

`setCopied` uses `setTimeout` without storing/clearing the timer ID. If the user clicks Copy twice quickly or navigates away before 2s, you can get a stale `setCopied(false)` on an unmounted component.

```tsx
const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// in handleCopy after setCopied(true):
copyResetRef.current = window.setTimeout(() => setCopied(false), 2000);
// useEffect cleanup: clearTimeout(copyResetRef.current)
```

### `frontend/src/components/landing/HeroScene.tsx`

Not imported anywhere (`LandingPage` implements its own hero). Delete unless kept for a follow-up (~200 lines of drift).

### `frontend/src/components/landing/Trail.tsx`

`TRAIL_STEPS` is only consumed here; nothing imports `Trail`. The live page uses the fixed compass + `trailScale` in `LandingPage`. Safe to remove if not planned.

### `frontend/src/components/landing/mocks.tsx`

`FieldNotes` / earlier mock prototypes look superseded by `AppMocks.tsx` + `mockRegistry`. No imports found.

### `frontend/src/components/landing/mockRegistry.ts` (~L12)

`signup: SignUpMock` is registered but never referenced from `LandingPage` (only `team`, `leaderboard`, `reward`). Add a journey beat or drop from registry.

### `frontend/src/components/landing/AppMocks.tsx`

`VerifyGeoMock` and `ClueImageMock` appear unused (geo success is inline in `ClueGeoMock`; image flow uses `ImageCaptureMock`).

### `frontend/src/components/LandingPage.tsx` (~L305)

Repo frontend conventions prefer Tailwind over inline styles. Use rotate utilities from `data.tsx` or `motion.div` with `rotate` like the compass.

### `frontend/src/components/landing/AppMocks.tsx` (~L41)

`alt=""` is correct only if Bliss is purely decorative. For the Windows XP easter egg, consider: `alt="Bliss hills wallpaper (Windows XP)"`.

### `frontend/public/landing/bliss.png`

~468KB PNG will land in PWA precache. Consider WebP/AVIF or a smaller export for mobile.

### `frontend/src/components/landing/journey.ts` (~L5)

Minor: shared `interface` / `type` definitions usually live under `frontend/src/types/`.

---

## Non-blocking

- `ClueGeoMock` phase timers already have proper `clearTimeout` in effect cleanup
- Confetti on reward section respects `useReducedMotion`
- Worth a quick mobile pass on the Netlify deploy preview for horizontal overflow
