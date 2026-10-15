# kayyoom.dev — Portfolio

Personal portfolio of **Kayyoom Ali**, Senior React Native Engineer.

**Live:** https://kayyoomali.netlify.app

## Highlights

- Interactive phone mockup with a simulated BLE pairing flow (auto-connect, retry, fallback)
- `⌘K` / `Ctrl+K` command palette — navigate, copy email, switch theme and accent
- Project filters, detail modals and App Store / Google Play links
- Scroll-driven reveals, count-up metrics, experience timeline
- Light / dark theme, keyboard accessible, respects `prefers-reduced-motion`

## Stack

Plain HTML, CSS and JavaScript — no framework, no build step, no dependencies.

```
index.html   page markup
styles.css   styles and theming
script.js    interactions
resume.pdf   downloadable résumé
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy

Hosted free on Netlify. With this repo linked to the Netlify project, every push to `main` redeploys the site.
