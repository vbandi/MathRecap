# Authoring skill illustrations

An illustration is an interactive explainer for one skill, shown on the Gyakorlás page
(`worksheet.html?skill=<ID>`) above the worksheet generator. Its job is to make the idea
*click* for a learner (grade 5–12) — not to be a textbook page.

## Reference implementations

Read at least two before writing, and match their structure and quality:

- `log-06.js` (Venn diagram, animated chips), `sza-12.js` (fraction bars, keyed fade-in lines),
  `alg-13.js` (balance scale, click interaction, scripted demo), `fug-10.js` (coordinate plot,
  sliders, challenge mode), `geo-36.js` (rearrangement proof with CSS-transitioned SVG),
  `ese-24.js` (urn simulation with SVG chart).
- `kit.js` — the shared helpers. Use them instead of re-implementing.
- `illustrations.css` — available classes (`il-card`, `il-controls`, `il-btn`, `il-toggle`,
  `il-svg`, `il-formula`, `il-equation`, `il-message`, `il-key`, `il-move`, `il-fade`, `il-table`, …).

## Module contract

- File: `poc/illustrations/<id-lowercase>.js`, e.g. `geo-14.js` for `GEO-14`.
- `export function mount(root)` builds everything inside `root` and returns a cleanup function.
  Put every timer/animation frame through `createScope()` and return `() => scope.clearAll()`.
- No DOM access at import time (the module is imported by node tests).
- Do **not** edit `kit.js`, `illustrations.css`, `registry.js` or any other shared file. If you
  need a helper, define it inside your module. Style with SVG attributes, inline `style`, and the
  existing classes and CSS variables (`--accent`, `--fg`, `--fg-soft`, `--dim`, `--surface`,
  `--input`, `--line`, `--line-strong`, `--warn`, `--ai`, and the `PALETTE` colours from `kit.js`).
- Build DOM with `make`/`svg`/`rich`/`fraction`; never assign `innerHTML`.

## Page structure

1. `lead(...)` — 1–3 plain sentences: what the idea is, in learner language. No curriculum jargon
   ("tudatosítása", "előkép"); introduce a technical term only after saying what it means.
2. One or two `card(...)`s with the interactive part. Something should move or respond; prefer
   direct manipulation (sliders, steppers, clicking/dragging objects) plus an optional scripted
   "Mutasd meg" demo for procedures.
3. Optional challenge ("Kihívás") where the learner must do it themselves and gets feedback.
4. `keyIdea(...)` — the one sentence to remember.

Keep each module roughly 120–300 lines. Quality over feature count.

## Stable layout (important — the user explicitly complained about this)

Changing a control must not make surrounding text or controls jump:

- Values that change go into fixed-width boxes: `slot(text, widthInCh, { align })`.
- Equations/relations use `equation(left, right, relation)` so the sign stays centred.
- Don't centre text whose length changes; left-align lines that grow.
- Terms that vanish for special values (coefficient 1, a zero term) are shown dimmed
  (`slot(..., { dim: true })`) instead of removed.
- Message lines use `il-message` (reserves two lines); don't put messages above controls if their
  length varies a lot.
- SVG figures keep a fixed `viewBox`; rescale content inside, not the box.

## Language and numbers

- All identifiers, comments and file names in English. All user-visible text in Hungarian.
- Numbers: `formatNumber` (decimal comma, real minus sign). Hungarian instrumental suffix:
  `withInstrumental(n)` → `3-mal`. Avoid other number+suffix forms (e.g. "a/az" articles, `-ed/-ad`)
  by rephrasing.
- Maths must be correct. Double-check every formula, every generated example and every edge case
  (zero, negative, equal values, maximum slider values). Prefer integer-friendly defaults.

## Checking your work

1. `node --check poc/illustrations/<file>.js` and
   `node -e "import('./poc/illustrations/<file>.js').then(m => console.log(typeof m.mount))"`
   (from the repo root; must print `function`).
2. In the browser: the dev server is already running at `http://localhost:62563`. Open
   `http://localhost:62563/worksheet.html?skill=<ID>&dev-illustration` in **your own new tab**
   (never navigate, close or resize other tabs — other people are using them). Check the console
   for errors, exercise every control, and look at a screenshot. Do not start or stop servers.
