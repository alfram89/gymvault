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

Top-level files in `src/`: `App.jsx` (all state), `helpers.js` (uid, fmtTime, localISODate, weekOf, calcVol, isCardioSet/isTimeSet, newCardioInterval, validateBackup), `constants.js` (MUSCLE_COLORS, DIFF_COLORS, re-exports EXERCISES from exercises.json), `db.js` (persistence), `Icons.jsx`, `BarbellIcon.jsx`, `TemplatePicker.jsx`, `main.jsx`, `index.css`.

The app is an installable PWA: `vite.config.js` configures `vite-plugin-pwa` (service worker, manifest, font caching).

### Data flow

`App` (in `App.jsx`) owns all state and passes it down as props. There is no context, no global store. The component tree is:

```
App
├── Onboarding          (first-run only, src/components/Onboarding.jsx)
├── WheelPicker         (fixed-position overlay, opened by any number input)
├── TemplatePicker      (src/TemplatePicker.jsx — fixed-position overlay, opened from ProgramsTab)
├── WorkoutSummary      (fixed-position overlay, shown after finishing a workout)
├── ProgramWizard       (fixed-position overlay, generates a personalised program)
└── <tab content>       (5 tabs: Workout, Programs, Library, History, Settings)
    ├── ProgramTab      ── CardioExCard (src/components/CardioExCard.jsx, per cardio exercise) — the "Workout" tab
    ├── ProgramsTab     (src/tabs/ProgramsTab.jsx — program list: switch / rename / duplicate / delete)
    ├── LibraryTab
    ├── HistoryTab
    └── SettingsTab
```

All tab components receive `t` (the current translations object) as their first prop.

### Multi-program model

The app stores a **list of programs** (`programs` state in `App`), each `{ id, name, days, program }` where `days`/`program` have the same shape as a single program ever did. `activeProgramId` (persisted in `settings`) selects the active one. `App` derives `days`/`program` from the active program and exposes **wrapper setters** `setDays`/`setProgram` that write changes back into the active program's slot — so `ProgramTab`, `LibraryTab` and `SettingsTab` keep their original `days`/`setDays`/`program`/`setProgram` interface unchanged. Switching programs is lossless (each program keeps its own weights). `ProgramsTab` manages the list; `applyTemplate(tpl, mode)` creates a new program (`mode !== 'add'`) or appends days to the active one (`'add'`). `buildProgramDays` (in `helpers.js`) expands a template into live `{ days, program }` and is shared by templates, the wizard, and legacy migration.

### Persistence

`src/db.js` wraps Dexie (IndexedDB) as a simple key-value store via `dbGet(key)` / `dbSet(key, value)`. `loadAllData()` fetches all keys in parallel on mount.

Keys in use: `settings` (includes `activeProgramId`, `selectedDay`), `programs` (the program list), `history`, `customExercises`, `activeWorkout` (in-flight workout so it survives a refresh — includes `programId`; `null` when no workout is running). Legacy keys `days`, `program` and `userTemplates` are no longer written but are still read on load and migrated into `programs` the first time (see `migrateLegacy` in `App.jsx`).

Every piece of state that needs persistence has a corresponding `useEffect` in `App` that calls `dbSet` whenever it changes. The `loaded` flag gates all writes so initial DB hydration doesn't overwrite itself.

### Exercise data

`src/data/exercises.json` — 83 exercises (67 strength, 16 cardio), each with `{ id, name, mg, eq, dif }`. Cardio exercises additionally have `type: "cardio"` and a `metrics` array. `id` is the stable reference key used everywhere else (program slots, templates, history).

Valid values:
- `mg`: `chest` `back` `legs` `shoulders` `arms` `core` `cardio`
- `eq`: `barbell` `dumbbell` `cable` `machine` `bodyweight`
- `dif`: `beginner` `intermediate` `advanced`
- `metrics` (cardio only): `duration` `distance` `speed` `incline` `calories` `heart_rate` `resistance`

Optional fields the UI honours: `inputMode: "time"` (sets track `secs` instead of reps/weight, e.g. plank), `weightLabel` (`"kg/hand"` or `"added"`), `repsMax`, `weightMax`, `weightStep` (wheel-picker ranges).

### Program templates

`src/data/templates/*.json` — each file is one template. `src/data/templates/index.js` uses `import.meta.glob` to load them all automatically; **no index update needed when adding a new file**.

Template schema: `{ id, name, description, tags[], days: [{ name, exercises: [{ exerciseId, sets, reps, restTime }] }] }`. Per exercise, `reps` is replaced by `secs` for time-mode exercises and by `duration` (minutes) for cardio exercises; `buildProgramDays` in `helpers.js` expands the `sets` count into the right set/interval shape.

Users create their own programs in the Programs tab (from a template, the wizard, or by duplicating); these live in the `programs` list, not as separate templates. The backup file is **version 2**: `{ version: 2, programs, activeProgramId, history, customExercises, settings }`. Import (`validateBackup` + `importData` in `App.jsx`) accepts both v2 and the legacy `days`/`program`/`userTemplates` shape (the latter runs through the same migration as DB load).

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
