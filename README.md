# Pathways — Progress Tracker

A mobile-first web app for tracking your objectives across three pathways:
📊 Data Science, 🤖 Reinforcement Learning, and 🇯🇵 日本語.

No build step, no backend — pure HTML/CSS/JS. Progress is saved in your
browser's `localStorage`, on-device.

## Deploy to GitHub Pages (2 minutes)

1. Create a new GitHub repository (e.g. `pathways`).
2. Upload all files in this folder to the repo root (`index.html`, `style.css`,
   `app.js`, `manifest.json`, and the `icons/` folder), keeping the folder
   structure intact.
   - Easiest way: on GitHub, click **Add file → Upload files**, drag the whole
     contents of this folder in, and commit.
3. Go to **Settings → Pages** in your repo.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
5. Wait ~1 minute, then visit the URL GitHub gives you
   (usually `https://<your-username>.github.io/<repo-name>/`).

## Add it to your iPhone Home Screen

1. Open the deployed URL in Safari on your iPhone.
2. Tap the **Share** icon → **Add to Home Screen**.
3. It'll launch full-screen like a native app, with its own icon.

## Notes on the data

- Editing objectives: everything lives in `app.js` under the `PATHWAYS`
  object — names, icons (emoji), and chain order. Edit and re-upload to
  change anything.
- The three books under 日本語 → 本 were transcribed from your photo as best
  as legible: *君の不在の夜を歩く* (雛倉さりえ), *コンビニ人間* (村田沙耶香),
  *殺戮に至る病* (我孫子武丸). Worth double-checking against the physical
  covers and editing `app.js` if any title is off.
- Progress is stored per-browser via `localStorage` — it won't sync across
  devices. If you clear Safari's site data, progress resets.
- Data Science and 日本語 objectives ask for a target end date when started.
  Reinforcement Learning (and 日本語 → アニメ) skip the date step entirely,
  per the spec.
- 聴解 (Todaii News, Podcast, Waku Waku Drama, NHK transcribe) is shown as a
  permanent, non-clickable reference list and doesn't count toward progress.
