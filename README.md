# wiradifit.github.io

Personal portfolio — **Prawira Hadi Fitrajaya**, Senior iOS Engineer.

Live: https://wiradifit.github.io

## About

Multi-market iOS trading engineer with hands-on experience building US Stocks,
ID Stocks, Mutual Funds, and CFD trading surfaces at Ajaib. This site showcases
shipped work, technical specs, focus areas, and independent side projects.

## Stack

Static site. No build step, no dependencies — plain HTML, CSS, and vanilla JS,
so GitHub Pages serves it directly.

- `index.html` — content & structure
  - Hero, About, Figures (by the numbers), Focus Areas
  - Work — US Stocks TP/SL, Amend, Live Price Sockets, TCA, Options,
    ID Stocks (Stock Lite/Pro, Project Beta, Short Sell & Collateral,
    Cross-Market), Performance Instrumentation
  - Experience (timeline), Technical Writing (tech specs), Stack
  - Side Projects (GitHub repos), Contact
- `styles.css` — "Liquid Glass" design system: glass morphism, ambient mesh
  wallpaper, pointer-reactive specular sheen, concentric radii, HIG typography
  (SF Pro + New York serif accents), light/dark adaptive, full responsive
- `main.js` — scroll reveals, count-up stats, mobile menu, pointer-reactive
  glass sheen, nav auto-hide (all GPU-friendly & `prefers-reduced-motion` aware)

## Contact

- Email: fitrajayaprawira@gmail.com
- WhatsApp: [+62 812-9866-0983](https://wa.me/6281298660983)
- LinkedIn: https://www.linkedin.com/in/wiradifit
- GitHub: https://github.com/wiradifit

## Develop locally

```bash
python3 -m http.server 8765
# open http://localhost:8765
```

## Deploy

Push to `main`; GitHub Pages (user site) publishes the root automatically.
`.nojekyll` disables Jekyll processing.
