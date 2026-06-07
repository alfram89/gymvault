# 💪 GymTrack

A private, offline-first workout tracker. No account, no cloud, no ads — your data never leaves your device.

[![Deploy to GitHub Pages](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/alfram89/GymTrack/actions/workflows/deploy.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

---

## Try it

**https://alfram89.github.io/GymTrack/**

Works in any browser. To install as an app:

- **iOS Safari** — Share → Add to Home Screen
- **Android Chrome** — Menu → Add to Home Screen
- **Desktop Chrome / Edge** — click the install icon in the address bar

Fully offline after the first load.

---

## Features

- **Programs** — Multi-day programs with a library of 57 exercises across 7 muscle groups. Strength and cardio (interval tracking) supported.
- **Templates** — Built-in programs (StrongLifts 5×5, PPL, Upper/Lower, Full Body) and save your own. The Program Builder auto-generates a personalised plan from your goals and equipment.
- **Workout logging** — Mark sets complete, auto rest timer, live duration in the header.
- **History** — Stats overview, intensity heatmap, muscle balance radar, weekly volume by muscle group, per-exercise weight progression with PR markers, and a filterable session log.
- **Portable data** — Export and import everything as JSON from Settings.

---

## Tech stack

| | |
|---|---|
| UI | React 19 |
| Build & PWA | Vite 8 + vite-plugin-pwa |
| Storage | Dexie 4 (IndexedDB) |
| Charts | Recharts 3 |

---

## Contributing

### Adding an exercise

Add an entry to `src/data/exercises.json`:

```json
{ "id": "cable-curl", "name": "Cable Curl", "mg": "arms", "eq": "cable", "dif": "beginner" }
```

| Field | Values |
|---|---|
| `mg` | `chest` `back` `legs` `shoulders` `arms` `core` `cardio` |
| `eq` | `barbell` `dumbbell` `cable` `machine` `bodyweight` |
| `dif` | `beginner` `intermediate` `advanced` |

For cardio, add `"type": "cardio"` and a `"metrics"` array:

```json
{ "id": "treadmill", "name": "Treadmill", "mg": "cardio", "eq": "machine", "dif": "beginner",
  "type": "cardio", "metrics": ["duration", "distance", "speed"] }
```

Available metrics: `duration` `distance` `speed` `incline` `calories` `heart_rate` `resistance`

### Adding a program template

Drop a `.json` file in `src/data/templates/` — picked up automatically, no index update needed.

```json
{
  "id": "my-program",
  "name": "My Program",
  "description": "Shown in the template picker.",
  "tags": ["beginner", "barbell"],
  "days": [
    {
      "name": "Day A",
      "exercises": [
        { "exerciseId": "squat", "sets": 3, "reps": 8, "restTime": 120 }
      ]
    }
  ]
}
```

Valid tags: `beginner` `intermediate` `advanced` `strength` `hypertrophy` `barbell` `dumbbell` `bodyweight`

---

## License

[GNU Affero General Public License v3.0](LICENSE)
