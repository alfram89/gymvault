# 💪 GymTrack

A private, offline-first workout tracker. No account, no cloud, no ads. Your data stays on your device.

## Features

- **4 tabs** — Program, Library, History, Settings
- **Exercise library** — 47 exercises across 6 muscle groups, color coded
- **Custom exercises** — add your own with muscle group, equipment, difficulty
- **Multi-day programs** — Day A / Day B / etc., fully renameable
- **Workout mode** — tap to complete each set, auto rest timer
- **History** — training calendar heatmap, streak counter, PRs, weekly volume chart, per-exercise weight progression
- **Data portability** — JSON export with timestamp, import with confirmation
- **PWA** — installable on iOS, Android, and desktop
- **Offline** — works with no internet after first load
- **Dark / light mode** — dark by default
- **kg / lbs** — global unit toggle

## Tech Stack

- React 18
- Vite + vite-plugin-pwa
- Dexie.js (IndexedDB) — all data persists locally
- Recharts — history charts
- DM Sans + DM Mono fonts

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Dev server (localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

## Install as PWA

Open the URL on your phone:
- **iOS Safari** → Share → Add to Home Screen
- **Android Chrome** → Menu → Add to Home Screen (or install banner)
- **Desktop Chrome** → Click install icon in address bar

## Data & Privacy

All data is stored in your browser's IndexedDB. Nothing is sent anywhere. Use the JSON export in Settings to back up your data.

## License

MIT — free to use, modify, and distribute.
