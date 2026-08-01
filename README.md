# Pathways — Progress Tracker

A self-contained, mobile-first progress tracker for three learning pathways: Data Science, Reinforcement Learning, and 日本語. No build step, no backend — progress is saved in your browser's `localStorage`.

## What's new in this version

- Renamed the home-screen section label to **"active pathways"**.
- **Data Science**: all 6 objectives (4 books + Kaggle + a new **Explore AutoML** objective) are now independent/parallel — start any one, or several at once, in any order. Each still requires an end date.
- **Reinforcement Learning**: the 5 **Papers** are now independent/parallel too. **Projects** stay a linked chain (Autolift → Humanoid Standup → Car Racing DQN → Inverted Pendulum). The three Autolift stages now use drone-specific icons (🛫 liftoff, 🚁 flight, 🛬 landing).
- **日本語**: the 聴解 reference items (Todaii News, Japanese Podcast, Waku Waku Drama, NHK News Transcribe) are no longer purely static — tap one to open a counter popup (0, with a `+`/`−` to log sessions), and the running total shows beside the icon.
- Fixed the third 本 title to **妖怪怪談**.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload these files to the repo root: `index.html`, `manifest.json`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
3. In the repo, go to **Settings → Pages**, set **Source** to your default branch (e.g. `main`) and folder `/ (root)`, then save.
4. GitHub will give you a URL like `https://<username>.github.io/<repo>/` — that's your app.

## Adding it to your iPhone home screen

1. Open the GitHub Pages URL in **Safari** on your iPhone.
2. Tap the **Share** icon → **Add to Home Screen**.
3. It'll launch full-screen, app-style, using the icon and name from `manifest.json`.

## How progress is saved

Everything is stored locally in your browser via `localStorage` (key `pathways_tracker_state_v2`) — nothing is sent anywhere. This means progress is per-device/per-browser; it won't sync across your phone and laptop unless you use the same browser profile.

## Editing objectives later

All pathway/objective data lives in the `PATHWAYS` object near the top of the `<script>` block in `index.html`. Each group has:
- `sequential: true` → objectives unlock one after another (chain).
- `sequential: false` → all objectives are available immediately (parallel).
- `requiresDate: true` → starting an objective opens the date picker; `false` → it starts immediately as "IN PROGRESS".
- `type: 'counter'` → renders as a tap-to-log counter instead of a tracked chain (used for 聴解).
