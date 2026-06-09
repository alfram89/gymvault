# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the dist/ build locally
```

Deploying is automatic: every push to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and publishes to GitHub Pages at **https://alfram89.github.io/GymTrack/**.

## Language

All pull request titles, descriptions, and commit messages must be written in **English**.

## Git workflow

**Always create a feature branch before making changes** — never commit directly to `main`. This keeps GitHub Actions deployments intentional and allows proper PRs.

```bash
git checkout -b feat/<short-name>   # start work
git push origin feat/<short-name>
gh pr create                         # open PR when done
```

## Architecture

Everything lives in `src/`, organised into:

| Directory | Contents |
|---|---|
| `src/components/` | Shared UI components (Modal, WheelPicker, Onboarding, WorkoutSummary, ProgramWizard, CardioExCard) |
| `src/tabs/` | One file per tab (ProgramTab, LibraryTab, HistoryTab, SettingsTab) |
| `src/data/` | `exercises.json`, `exerciseInfo.js` (how-to descriptions), `templates/` |
| `src/i18n/` | `en.json` and translation loader |
| `src/utils/` | `programGenerator.js` (AI-style program builder logic) |

### Data flow

`App` (in `App.jsx`) owns all state and passes it down as props. There is no context, no global store. The component tree is:

```
App
├── Onboarding          (first-run only, src/components/Onboarding.jsx)
├── WheelPicker         (fixed-position overlay, opened by any number input)
├── TemplatePicker      (src/TemplatePicker.jsx — fixed-position overlay)
├── WorkoutSummary      (fixed-position overlay, shown after finishing a workout)
├── ProgramWizard       (fixed-position overlay, generates a personalised program)
└── <tab content>
    ├── ProgramTab      ── CardioExCard (src/components/CardioExCard.jsx, per cardio exercise)
    ├── LibraryTab
    ├── HistoryTab
    └── SettingsTab
```

All tab components receive `t` (the current translations object) as their first prop.

### Persistence

`src/db.js` wraps Dexie (IndexedDB) as a simple key-value store via `dbGet(key)` / `dbSet(key, value)`. `loadAllData()` fetches all keys in parallel on mount.

Keys in use: `settings`, `days`, `program`, `history`, `customExercises`, `userTemplates`.

Every piece of state that needs persistence has a corresponding `useEffect` in `App` that calls `dbSet` whenever it changes. The `loaded` flag gates all writes so initial DB hydration doesn't overwrite itself.

### Exercise data

`src/data/exercises.json` — 57 exercises, each with `{ id, name, mg, eq, dif }`. Cardio exercises additionally have `type: "cardio"` and a `metrics` array. `id` is the stable reference key used everywhere else (program slots, templates, history).

Valid values:
- `mg`: `chest` `back` `legs` `shoulders` `arms` `core` `cardio`
- `eq`: `barbell` `dumbbell` `cable` `machine` `bodyweight`
- `dif`: `beginner` `intermediate` `advanced`
- `metrics` (cardio only): `duration` `distance` `speed` `incline` `calories` `heart_rate` `resistance`

### Program templates

`src/data/templates/*.json` — each file is one template. `src/data/templates/index.js` uses `import.meta.glob` to load them all automatically; **no index update needed when adding a new file**.

Template schema: `{ id, name, description, tags[], days: [{ name, exercises: [{ exerciseId, sets, reps, restTime }] }] }`.

User-saved templates follow the same schema and are stored in IndexedDB under `userTemplates`.

### Translations

`src/i18n/en.json` holds all UI strings. `getTranslations(lang)` returns the object; it falls back to `en` for missing languages. To add a language: copy `en.json`, translate, import in `src/i18n/index.js`.

### Icons & styling

`src/Icons.jsx` exports named SVG components (`IconBarbell`, `IconDumbbell`, etc.) and lookup maps `EQ_ICONS` and `MG_ICONS`. `DiffBars` renders a 3-bar difficulty indicator.

`src/index.css` is a single flat stylesheet using CSS custom properties (`--bg`, `--text`, `--border`, etc.) switched by `.app.dark` / `.app.light` on the root element.

The app is a 480px-max-width column with a sticky header, scrollable `<main>`, and a tab bar pinned to the bottom of the fixed container. `tab-scroll` is the scrollable content area for each tab.

### Workout state machine

`workoutActive` (bool) in `App` is the mode flag. When active:
- `workoutSets` (`{ [exId]: [{ ...set, completed }] }`) tracks live set state separately from the saved program — the program is only updated when the workout is finished.
- The Start/Finish button lives in `ProgramTab`'s sticky action bar (not floating).
- The rest timer (`restActive`, `restSecs`, `restMax`) lives in `App` and is triggered via `onRestTimer(seconds)` callback.
