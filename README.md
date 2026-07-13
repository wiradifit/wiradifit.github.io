# wiradifit.github.io

Personal portfolio — **Prawira Hadi Fitrajaya**, Senior iOS Engineer.

Live: https://wiradifit.github.io

## Stack
Static site. No build step, no dependencies — plain HTML, CSS, and vanilla JS,
so GitHub Pages serves it directly.

- `index.html` — content &amp; structure (Hero, About, Figures, Focus, Work with US &amp; ID Stock cards, Experience, Tech Specs, Stack, Side Projects, Contact)
- `styles.css` — "Liquid Glass" design system, glass morphism, ambient wallpaper, light/dark adaptive
- `main.js` — scroll reveals, count-up stats, mobile menu, pointer-reactive glass sheen, nav auto-hide

## Develop locally
```bash
python3 -m http.server 8765
# open http://localhost:8765
```

## Deploy
Push to `main`; GitHub Pages (user site) publishes the root automatically.
`.nojekyll` disables Jekyll processing.
