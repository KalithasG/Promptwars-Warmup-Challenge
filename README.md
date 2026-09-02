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

## Design — Apple HIG

The UI follows Apple's Human Interface Guidelines rather than a bespoke style:

- **Clarity.** One neutral palette, a strict type scale (`.t-display` → `.t-caption`
  in `globals.css`), and generous negative space. Large text takes tighter
  tracking and small text looser, the way SF Pro is designed to be set.
- **Deference.** The UI recedes so the content leads: hairline separators, a
  translucent nav using a blurred material, and a single accent colour
  (systemBlue) reserved for action.
- **Depth.** Layering by elevation and blur, never by decoration — grouped
  section bands, elevated cards at an 18px radius, pill controls at 980px.

Colours are Apple's own semantic values (`#1d1d1f`, `#f5f5f7`, `#0071e3` and the
dark-mode counterparts), chosen so the black-and-white portrait is the only
thing on the page with real contrast.

**Appearance** follows the system by default; the control in the nav sets an
explicit override, stored in `localStorage` and applied before first paint by a
small script in the document head, so a dark-mode visitor never sees a light
flash.

**Typography** prefers SF Pro where it exists (Apple platforms) and falls back
to Inter everywhere else, so the page looks the same on Windows and Android.

**The portrait** is a cut-out: the subject and the ink splatter were keyed off
the original poster's light ground by combining a person mask with a luminance
key, so the strokes survive where a person mask alone would have dropped them.
It sits at up to 920px wide — deliberately the largest element on the page.

To swap it: replace `public/portrait-cutout.webp` (transparent PNG/WebP), and
locally run `rm -rf .next/cache/images` afterwards, or Next keeps serving a
cached optimized variant of the old picture.

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

## The 3D layer

A restrained ambient field sits behind the hero: five very large, very soft
forms drifting slowly at low opacity, built from sprites alone — no lights, no
shadows, no post-processing — so it stays smooth on a phone. HIG deference
applies here too: it reads as atmosphere, never as decoration competing with
the portrait. The portrait itself picks up a few pixels of pointer parallax,
which is the only other motion on the page.

It backs off where it should: no WebGL, `prefers-reduced-motion`, or a coarse
pointer each degrade it to a static CSS wash, and a render error falls through
rather than leaving an empty box. Every fact is real DOM — nothing meaningful
lives inside the canvas.

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
