# ankitpasayat.com

Personal site. A working terminal with cool phosphor text and a character-drawn
koi pond. Every page has a simpler paper-and-serif counterpart with a light pond.
All content and links still work without JavaScript. No frameworks on the wire,
no web fonts, no trackers.

## Stack

- [Astro](https://astro.build) static output; vanilla TypeScript runs the prompt and pond
- System monospace fonts, CRT effects in pure CSS
- Cloudflare Pages behind `ankitpasayat.com`

## Pond preview

Four koi of different sizes are rendered entirely from text characters on a
canvas. Click or tap to create soft, overlapping waves; nearby fish turn away
briefly along a forward-moving curve, then return to a gentle pace. This is a stylized interaction,
not an animal-behavior simulation. The pause control stops all pond motion,
reduced-motion preferences start it paused, and hidden tabs stop rendering.

The terminal and plain layouts share the same renderer with separate palettes.
The wallpaper is decorative; content and native controls remain accessible.

```sh
npm run check
npm run build
node --test tests/koi-motion.test.mjs   # Node 22.18+ / 24 recommended
```

Preview changes locally before deploying the static build to Cloudflare Pages.

## Résumé

The editable source is `resume/resume.tex`; the site serves `public/resume.pdf`.
Compile with Tectonic (0.17.0 was used for the current PDF):

```sh
tectonic --outdir public resume/resume.tex
```

The Shell entry identifies Andor Tech as the employer and Shell as the dedicated
client assignment. It ends in February 2026; the exact last working day,
27 February 2026, is retained in a source comment for application forms.
Hire A Clanker records the active founding role from March to October 2026,
ending on 22 October. The public copy uses email rather than a phone number.

## Develop

```sh
npm install
npm run dev      # localhost:4321 with hot reload
npm run build    # static build → dist/
npm run preview  # serve dist/ locally
npm run deploy   # build + wrangler pages deploy
```

## Write a post

Drop a markdown file in `src/content/blog/`:

```md
---
title: Post title
date: 2026-07-16
description: optional one-liner
---

Body.
```

Then `npm run deploy`.

## Pages

`/` terminal · `/blog` · `/now` · `/uses` · `/resume.pdf` — every page mirrored under `/plain/…`

---

© 2026 Ankit Pasayat. All rights reserved — see [LICENSE](LICENSE).
