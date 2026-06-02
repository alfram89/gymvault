> **⚠️ This project is under active development.** Features may change, and some rough edges are expected.

# 💪 GymTrack

A private, offline-first workout tracker. No account, no cloud, no ads — your data never leaves your device.

[![Deploy to GitHub Pages](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

---

## Features

### 📋 Program
- Multi-day workout programs (Day A / B / Push / Pull / Legs — fully renameable)
- Add, remove, and drag-to-reorder exercises within a day
- Per-exercise rest timer with configurable duration
- Mark individual exercises as warmup sets
- **Sticky Start / Finish Workout button** pinned below the day selector — never covers your inputs
- **Number wheel picker** for all numeric fields (weight, reps, rest time, cardio metrics) — no keyboard pop-up on mobile

### 📚 Library
- 57 exercises across 7 muscle groups, color-coded by group
- Filter by muscle group, equipment, and difficulty
- **Equipment icons** on each card (barbell, dumbbell, cable, machine, bodyweight)
- **Difficulty bars** (beginner / intermediate / advanced) shown visually on every card
- Create fully custom exercises with any muscle group, equipment, and difficulty
- Add exercises directly to any program day from the library

### 📋 Program Templates
- 4 built-in programs ready to load:
  - **StrongLifts 5×5** — beginner barbell, 2 days alternating A/B
  - **Push / Pull / Legs** — intermediate hypertrophy, 3 days
  - **Upper / Lower** — intermediate strength + hypertrophy, 4 days
  - **Full Body 3×** — beginner full body, 3 days
- Filter templates by tag (beginner, intermediate, strength, hypertrophy, barbell, bodyweight)
- Apply as a full replacement or add days alongside your existing program
- Save your own program as a reusable template
- **Easy to contribute:** drop a `.json` file in `src/data/templates/` — no other changes needed

### 📈 History
- Training calendar heatmap (12-week view)
- Day-streak counter
- Personal record (PR) tracker — automatically detected when a new max weight is logged
- Weekly volume bar chart
- Per-exercise weight progression line chart
- Full session log with per-set detail

### ⚙️ Settings
- Dark / light mode (dark by default)
- kg / lbs unit toggle
- Add, rename, and delete workout days
- Load a template program or save the current program as a template
- JSON export (with timestamp) and import
- Full data reset with confirmation
- PWA install prompt for iOS and Android

### 📲 PWA
- Installable on iOS, Android, and desktop
- Fully offline after first load
- Custom barbell icon on the home screen

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18 |
| Build | Vite 8 + vite-plugin-pwa |
| Storage | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Icons | Custom inline SVG |
| Fonts | DM Sans + DM Mono |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Install as PWA

Once deployed, open the app URL on your device:

- **iOS Safari** — Share → Add to Home Screen
- **Android Chrome** — Menu → Add to Home Screen (or tap the install banner)
- **Desktop Chrome / Edge** — click the install icon in the address bar

---

## Adding a Template

Create a new file in `src/data/templates/` — it will be picked up automatically at build time.

```json
{
  "id": "my-program",
  "name": "My Program",
  "description": "A short description shown in the template picker.",
  "tags": ["beginner", "barbell"],
  "days": [
    {
      "name": "Day A",
      "exercises": [
        { "exerciseId": "squat",       "sets": 3, "reps": 8, "restTime": 120 },
        { "exerciseId": "bench-press", "sets": 3, "reps": 8, "restTime": 120 }
      ]
    }
  ]
}
```

`exerciseId` values must match IDs in `src/data/exercises.json`. Any unrecognised IDs are silently skipped.

Valid tags: `beginner` `intermediate` `advanced` `strength` `hypertrophy` `barbell` `dumbbell` `bodyweight`

---

## Data & Privacy

All data is stored in your browser's **IndexedDB**. Nothing is sent to any server. Use the **JSON export** in Settings to back up or transfer your data between devices.

---

## License

[GNU Affero General Public License v3.0](LICENSE) — free to use, modify, and distribute under the same terms.
