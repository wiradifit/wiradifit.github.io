# wiradifit.github.io

Personal portfolio — **Prawira Hadi Fitrajaya**, Senior iOS Engineer.

Live: https://wiradifit.github.io

## Stack
Static site. No build step, no dependencies — plain HTML, CSS, and vanilla JS,
so GitHub Pages serves it directly.

- `index.html` — content & structure
- `styles.css` — "Ethereal Glass Trading Terminal" design system
- `main.js` — scroll reveals, count-up stats, mobile menu, and the animated
  Canvas 2D price chart in the hero (all GPU-friendly and `prefers-reduced-motion` aware)

## Develop locally
```bash
python3 -m http.server 8765
# open http://localhost:8765
```

## Deploy
Push to `main`; GitHub Pages (user site) publishes the root automatically.
`.nojekyll` disables Jekyll processing.
