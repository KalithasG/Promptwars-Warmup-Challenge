# Portfolio Development

A 3D portfolio site for **Kalithas Govindaraj**, Data Engineer — built so the
link itself carries the information: a person, a recruiter's tooling, or
another agent can all get the same facts without scrolling the page.

Next.js 16 · React Three Fiber · Tailwind 4 · Google Gemini

## The idea

Most portfolios only work one way: a human reads them. This one answers in
four:

| Route | For | What it gives back |
|-------|-----|--------------------|
| `/` | People | Editorial one-pager: hero, about, experience, projects, capability, contact |
| `/api/profile` | Machines | The whole profile as JSON, CORS-open |
| `/api/ask` | People in a hurry | A Gemini answer grounded strictly in the profile |
| `<head>` + `/opengraph-image` | Link previews | OG/Twitter card + JSON-LD `Person` |

## One file drives everything

`data/profile.json` is the single source of truth. Every section, the JSON
API, the OG card, the structured data, and the facts the AI may state all read
from it. Content is transcribed from LinkedIn — not from GitHub repositories.

Unfilled values are marked `TODO:`. They render as loud dashed placeholders on
the page and are **stripped** from `/api/profile` and the AI's fact sheet — a
placeholder is never served as though it were true.

```bash
npm run profile:todo   # lists every field still unfilled
```

## Design

The palette is sampled from the portrait rather than chosen. `--page` is
`#d9d8d6` — the median of the photograph's own border pixels, measured, not
estimated. The splatter black becomes `--ink`; the shirt's mid-greys become
`--ink-soft` and `--muted`.

Because the page and the photograph share exactly one ground colour, the image
needs no frame and no scrim: its four edges are blended to `--page` **in the
asset itself**, so there is no boundary to see. Two consequences worth knowing:

- Nothing in the hero may tint the page, or the page around the photo shifts
  while the photo does not, and the image reads as a floating block. That is
  why the hero carries no background tint, and why the paper grain sits
  *above* the content — so photograph and page take the same texture.
- The blend bakes `--page` into the JPEG. Change the page colour and the
  portrait has to be regenerated to match.

The palette is deliberately monochrome, so emphasis comes from weight and
scale, not hue. Type pairs a heavy grotesque with an italic display serif;
section headings pin to the viewport with `position: sticky` while their
content scrolls, which needs no scroll library.

To swap the photograph: replace `public/portrait.jpg` (and `public/avatar.jpg`
for the square crop), blend its edges to `--page`, and re-check the palette in
`app/globals.css` against the new image. Locally, run `rm -rf
.next/cache/images` after replacing it — Next otherwise keeps serving a cached
optimized variant, and you will be looking at the old picture.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

The site works fully without an API key; only the "Ask" box needs one.

```bash
cp .env.example .env.local   # then set GEMINI_API_KEY
```

Get a free key at https://aistudio.google.com/apikey.

## The AI answer path

`/api/ask` refuses to improvise. The model receives the profile as a fact
sheet and is instructed to say "not listed on the site" rather than invent an
employer, a date, or a number — a portfolio that fabricates credentials is
worse than no portfolio.

Behind it sits a latency-controlled router (`lib/router.ts`): a prompt is
classified into a tier with no extra API call, and each tier is an ordered
chain of `(model, timeout)` attempts that falls back to faster models when one
is slow, so total latency stays bounded. The model used and the round-trip
time are printed under every answer.

The endpoint is public, so it caps question length and rate-limits per IP.
That limiter is process-local and best-effort — put a real gateway limit in
front of it if the site gets traffic.

## The 3D hero

A graph of nodes with packets of ink travelling the edges — a data pipeline,
which is the subject of the portfolio rather than a decorative spinning shape.
It is built from three primitives (points, lines, points) instead of instanced
meshes, so it stays cheap on a phone, and sits behind the hero under a veil
that keeps type legible.

It backs off where it should: no WebGL, `prefers-reduced-motion`, or a small
screen each degrade it, and a render error falls through to a gradient rather
than an empty box. The hero text is real DOM, never 3D text, so it stays
selectable and readable by screen readers and scrapers.

## Deploy

Any Node host. On Vercel it needs no configuration beyond two env vars:

- `GEMINI_API_KEY` — for the assistant
- `NEXT_PUBLIC_SITE_URL` — canonical + OG URLs

## Layout

```
app/
  page.tsx              the one-pager, composed of pinned sections
  layout.tsx            metadata: OG, Twitter, canonical, fonts
  opengraph-image.tsx   the link-preview card, generated from profile.json
  api/profile/route.ts  machine-readable profile
  api/ask/route.ts      grounded AI answers
components/
  scene/                the 3D constellation + its guardrails
  AskMe.tsx             the ask box
  ui.tsx                Field / Label / Section / Card / Tag
lib/
  profile.ts            typed profile access + placeholder stripping
  router.ts             latency-controlled Gemini router
  classify.ts           zero-latency tier classifier
data/profile.json       ← the file you edit
public/portrait.jpg     the photograph the palette is sampled from
```

`model_routing/` and `model_routing_ts/` are the standalone router scaffolds
this site's router grew from. They run on their own and are kept as reference.
