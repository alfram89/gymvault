> **⚠️ This project is under active development.** Features may change, and some rough edges are expected.

# 💪 GymTrack

A private, offline-first workout tracker. No account, no cloud, no ads — your data never leaves your device.

[![Deploy to GitHub Pages](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

---

## Try it

**https://alfram89.github.io/GymTrack/**

No installation required — open the link in your browser. To use it as an app on your phone:

- **iOS Safari** — Share → Add to Home Screen
- **Android Chrome** — Menu → Add to Home Screen (or tap the install banner)
- **Desktop Chrome / Edge** — click the install icon in the address bar

The app works fully offline after the first load.

---

## What it does

**Build workout programs**
Create multi-day programs, add exercises from a library of 57 movements across 7 muscle groups, and structure your sets and reps. Cardio exercises (treadmill, bike, etc.) with interval tracking are also supported.

**Load a template**
Get started in seconds with a built-in program — StrongLifts 5×5, Push/Pull/Legs, Upper/Lower, or Full Body 3×. Apply it as your program or add the days alongside what you already have. You can also save your own programs as reusable templates.

**Log workouts**
Start a workout session, mark each set as completed, and let the rest timer count down automatically. When you finish, you get a summary showing sets, volume, and any new personal records.

**Track progress**
A 12-week training calendar, streak counter, personal records, weekly volume chart, and a per-exercise weight progression graph give you a clear picture of how you're improving over time.

**Portable data**
Export everything as a JSON file from Settings and import it again on any device. Nothing is stored on a server.

---

## Contributing

### Adding an exercise

Add an entry to `src/data/exercises.json`:

```json
{ "id": "cable-curl", "name": "Cable Curl", "mg": "arms", "eq": "cable", "dif": "beginner" }
```

| Field | Values |
|---|---|
| `id` | Unique kebab-case string |
| `mg` | `chest` `back` `legs` `shoulders` `arms` `core` `cardio` |
| `eq` | `barbell` `dumbbell` `cable` `machine` `bodyweight` |
| `dif` | `beginner` `intermediate` `advanced` |

For cardio exercises, add `"type": "cardio"` and a `"metrics"` array:

```json
{ "id": "treadmill", "name": "Treadmill", "mg": "cardio", "eq": "machine", "dif": "beginner",
  "type": "cardio", "metrics": ["duration", "distance", "speed", "incline"] }
```

Available cardio metrics: `duration` `distance` `speed` `incline` `calories` `heart_rate` `resistance`

---

### Adding a program template

Create a new `.json` file in `src/data/templates/` — it is picked up automatically at build time, no other file needs changing.

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

`exerciseId` must match an `id` in `exercises.json`. Unrecognised IDs are skipped with a warning in the picker.

Valid tags: `beginner` `intermediate` `advanced` `strength` `hypertrophy` `barbell` `dumbbell` `bodyweight`

---

## Tech Stack

| | |
|---|---|
| UI | React 18 |
| Build & PWA | Vite + vite-plugin-pwa |
| Storage | Dexie.js (IndexedDB) |
| Charts | Recharts |

---

## Data & Privacy

All data lives in your browser's IndexedDB. Nothing is sent to any server. Back up anytime via **Settings → Export JSON**.

---

## License

[GNU Affero General Public License v3.0](LICENSE)
