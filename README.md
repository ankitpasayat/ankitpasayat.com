# ankitpasayat.com

Personal site. A CRT terminal in the browser — amber phosphor, scanlines, a
refresh band, and a working prompt — every page a few KB of static HTML, each
with a zero-JS plain twin. No frameworks on the wire, no web fonts, no trackers.

## Stack

- [Astro](https://astro.build) static output; one small vanilla-JS island runs the prompt
- System monospace fonts, CRT effects in pure CSS
- Cloudflare Pages behind `ankitpasayat.com`

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
