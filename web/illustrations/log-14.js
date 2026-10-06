import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg } from "./kit.js";

const PROOF = [
  "Legyen a = 2k + 1 és b = 2m + 1, ahol k és m egész számok.",
  "Ekkor a + b = (2k + 1) + (2m + 1).",
  "Összevonva: a + b = 2k + 2m + 2.",
  "Kiemelve a 2-t: a + b = 2 · (k + m + 1).",
  "A k + m + 1 egész szám, ezért a + b egy egész kétszerese, vagyis páros. ∎",
];
const START_ORDER = [3, 0, 4, 2, 1];
const PARTS = [
  { text: "Páratlan az a szám, amely 2k + 1 alakba írható, ahol k egész.", label: "definíció" },
  { text: "Legyen a és b két páratlan szám.", label: "feltétel" },
  { text: "Ekkor a + b páros.", label: "állítás" },
  { text: "a = 2k + 1, b = 2m + 1, így a + b = 2 · (k + m + 1), ami páros.", label: "bizonyítás" },
];
const LABELS = ["definíció", "feltétel", "állítás", "bizonyítás"];
const PAIR_GAP = 56, LEFT = 30;

export function mount(root) {
  const scope = createScope();
  root.append(lead("A tétel olyan állítás, amiről be tudjuk látni, hogy mindig igaz. A bizonyítás lépésről lépésre megmutatja, miért. Itt ezt a tételt fogjuk vizsgálni: két páratlan szám összege páros."));

  // --- Part 1: what the theorem looks like.
  const parts = card("A tétel részei");
  const partBox = make("div");
  const partMessage = make("p", "il-message");
  parts.append(make("p", "il-muted", "Mi melyik mondat szerepe? Válaszd ki mindegyiknél."), partBox, partMessage);
  const chosen = new Map();
  function renderParts() {
    partBox.replaceChildren(...PARTS.map((part, i) => {
      const row = make("div");
      row.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:8px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--input)";
      const text = make("span", "", part.text);
      text.style.cssText = "flex:1 1 260px;color:var(--fg)";
      const group = make("span", "il-controls");
      group.style.margin = "0";
      for (const label of LABELS) {
        const pressed = chosen.get(i) === label;
        const colour = pressed ? (label === part.label ? "var(--il-green)" : "var(--il-red)") : undefined;
        const chip = make("button", "il-toggle", label);
        chip.type = "button";
        chip.setAttribute("aria-pressed", String(pressed));
        if (colour) chip.style.setProperty("--c", colour);
        chip.addEventListener("click", () => { chosen.set(i, label); renderParts(); });
        group.append(chip);
      }
      row.append(text, group);
      return row;
    }));
    const done = PARTS.every((part, i) => chosen.get(i) === part.label);
    const wrong = PARTS.find((part, i) => chosen.has(i) && chosen.get(i) !== part.label);
    partMessage.textContent = done ? "Mind helyes. A definíció megmondja, mit jelent a fogalom. A feltétel az, amit adottnak veszünk, az állítás az, amit be akarunk látni, a bizonyítás pedig az út a kettő között. ✓" : wrong ? "Valamelyik nem stimmel (pirossal jelölve). Gondold végig: mit tudunk már, és mit akarunk megmutatni?" : "";
    partMessage.className = `il-message ${done ? "good" : wrong ? "warn" : ""}`;
  }

  // --- Part 2: order the proof.
  const puzzle = card("Bizonyítás sorrendbe rakása");
  const lineBox = make("div");
  const puzzleMessage = make("p", "il-message");
  let order = [...START_ORDER], checked = false;
  puzzle.append(make("p", "il-muted", "A bizonyítás sorai összekeveredtek. A nyilakkal told a helyükre őket."), lineBox, controls(button("Sorrend ellenőrzése", () => { checked = true; renderLines(); })), puzzleMessage);
  function renderLines() {
    lineBox.replaceChildren(...order.map((lineIndex, position) => {
      const row = make("div");
      const ok = checked && lineIndex === position, bad = checked && lineIndex !== position;
      row.style.cssText = `display:flex;align-items:center;gap:10px;margin:6px 0;padding:8px 12px;border:2px solid ${ok ? "var(--il-green)" : bad ? "var(--il-red)" : "var(--line)"};border-radius:12px;background:var(--input)`;
      const badge = make("b", "", `${position + 1}.`);
      badge.style.cssText = "min-width:2ch;color:var(--dim)";
      const text = make("span", "", PROOF[lineIndex]);
      text.style.cssText = "flex:1;font-family:var(--font-mono);font-size:14px;color:var(--fg)";
      const move = (delta) => { const to = position + delta; if (to < 0 || to >= order.length) return; [order[position], order[to]] = [order[to], order[position]]; checked = false; renderLines(); };
      const up = button("↑", () => move(-1), { ghost: true }), down = button("↓", () => move(1), { ghost: true });
      up.disabled = position === 0; down.disabled = position === order.length - 1;
      up.setAttribute("aria-label", "Feljebb"); down.setAttribute("aria-label", "Lejjebb");
      row.append(badge, text, up, down);
      return row;
    }));
    const right = order.filter((lineIndex, position) => lineIndex === position).length;
    if (!checked) { puzzleMessage.textContent = ""; puzzleMessage.className = "il-message"; return; }
    if (right === PROOF.length) { puzzleMessage.textContent = "Helyes a sorrend! Minden sor az előzőből következik, az utolsó sor pedig éppen azt mondja ki, amit bizonyítani akartunk. ✓"; puzzleMessage.className = "il-message good"; }
    else { puzzleMessage.textContent = `${right} sor van jó helyen (zölddel jelölve). Kérdezd meg magadtól: melyik sort írhatjuk le az előzők nélkül? Melyik következik közvetlenül abból?`; puzzleMessage.className = "il-message warn"; }
  }

  // --- Part 3: dot picture.
  const dotsCard = card("Miért páros? Pontokkal");
  const state = { k: 2, m: 1, merged: false };
  const sliderA = range({ label: "a =", min: 0, max: 4, value: state.k, format: (v) => String(2 * v + 1), onInput: (v) => { state.k = v; state.merged = false; render(); } });
  const sliderB = range({ label: "b =", min: 0, max: 4, value: state.m, format: (v) => String(2 * v + 1), onInput: (v) => { state.m = v; state.merged = false; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 250", role: "img", "aria-label": "Páratlan számok pontokkal" });
  const dots = { a: [], b: [] };
  for (const [key, colour] of [["a", PALETTE.violet], ["b", PALETTE.blue]]) {
    for (let i = 0; i < 9; i++) dots[key].push(svg("circle", { r: 10, class: "il-move", style: `fill:${colour}` }, figure));
  }
  const labels = svg("g", {}, figure);
  const dotsMessage = make("p", "il-message");
  const mergeButton = button("Rakjuk össze!", () => { state.merged = true; render(); });
  dotsCard.append(make("p", "il-muted", "Egy páratlan szám párokra bontható, és marad egy pont."), controls(sliderA.element, sliderB.element), figure, controls(mergeButton, button("Vissza", () => { state.merged = false; render(); }, { ghost: true })), dotsMessage);

  function render() {
    const { k, m, merged } = state;
    const counts = { a: 2 * k + 1, b: 2 * m + 1 };
    labels.replaceChildren();
    const rows = { a: 50, b: 120 };
    const place = (key, index) => {
      const pairs = { a: k, b: m }[key];
      const leftover = index === 2 * pairs;
      let x, y;
      if (!merged) { y = rows[key]; x = leftover ? LEFT + pairs * PAIR_GAP + 6 : LEFT + (index >> 1) * PAIR_GAP + (index & 1) * 24; }
      else { y = 205; const pairIndex = leftover ? k + m : (key === "a" ? index >> 1 : k + (index >> 1)); x = LEFT + pairIndex * PAIR_GAP + (leftover ? (key === "a" ? 0 : 1) : index & 1) * 24; }
      return { x, y, leftover };
    };
    for (const key of ["a", "b"]) {
      dots[key].forEach((dot, index) => {
        if (index >= counts[key]) { dot.style.opacity = 0; return; }
        const { x, y, leftover } = place(key, index);
        dot.style.opacity = 1;
        dot.style.transform = `translate(${x}px, ${y}px)`;
        dot.style.fill = leftover ? PALETTE.amber : key === "a" ? PALETTE.violet : PALETTE.blue;
      });
    }
    const text = (x, y, content, colour) => svg("text", { x, y, text: content, style: `font-weight:700;${colour ? `fill:${colour}` : ""}` }, labels);
    if (!merged) {
      text(LEFT - 10, 88, `a = ${counts.a} = ${k} pár + 1 maradék pont`, PALETTE.violet);
      text(LEFT - 10, 158, `b = ${counts.b} = ${m} pár + 1 maradék pont`, PALETTE.blue);
    } else {
      text(LEFT - 10, 175, `a + b = ${counts.a + counts.b}: a két maradék (sárga) új párt alkot`, PALETTE.amber);
      text(LEFT - 10, 240, `${k} + ${m} + 1 = ${k + m + 1} pár, semmi sem maradt ki`);
    }
    dotsMessage.textContent = merged ? `Minden pont párban van, tehát ${counts.a} + ${counts.b} = ${counts.a + counts.b} páros. Képlettel: (2k + 1) + (2m + 1) = 2(k + m + 1).` : "A két szám maradék pontja egymás mellé kerülhet. Nyomd meg a „Rakjuk össze!” gombot.";
    dotsMessage.className = `il-message ${merged ? "good" : ""}`;
  }

  root.append(parts, puzzle, dotsCard, keyIdea("a tétel a „ha…, akkor…” alakú állítás: a feltételből kiindulva, lépésről lépésre, az állításhoz jutunk. Az algebrai bizonyítás és a pontokkal rajzolt kép ugyanazt mondja: két maradék pont éppen egy párrá áll össze."));
  renderParts();
  renderLines();
  render();
  return () => scope.clearAll();
}
