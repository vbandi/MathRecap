import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const TOTAL = 30, W = 620, DOT = 7;
const SETS = [
  { key: "F", name: "focizik", color: PALETTE.violet },
  { key: "S", name: "sakkozik", color: PALETTE.blue },
  { key: "T", name: "teniszezik", color: PALETTE.amber },
];
const GEOMETRY = {
  2: { height: 300, radius: 112, centers: [{ x: 245, y: 150 }, { x: 375, y: 150 }] },
  3: { height: 340, radius: 100, centers: [{ x: 250, y: 120 }, { x: 370, y: 120 }, { x: 310, y: 222 }] },
};

// Region counts from set sizes (two sets) or from the fixed three-set example plus the triple overlap.
function regionCounts(mode, values) {
  if (mode === 2) {
    const { f, s, both } = values;
    return { F: f - both, S: s - both, FS: both, "": TOTAL - (f + s - both) };
  }
  const t = values.triple;
  const r = { F: 4 + t, S: 2 + t, T: 1 + t, FS: 6 - t, FT: 5 - t, ST: 4 - t, FST: t };
  r[""] = TOTAL - Object.values(r).reduce((a, b) => a + b, 0);
  return r;
}

export function mount(root) {
  const scope = createScope();
  const state = { mode: 2, f: 18, s: 12, both: 5, triple: 2, step: 0, running: false };

  root.append(lead("Ha két csoport tagjait összeszámoljuk, azok, akik mindkettőben benne vannak, kétszer kerülnek be a számolásba. Ezt a kétszeres számolást kell kijavítani. Ez a logikai szita (más néven szitaformula) lényege."));

  const play = card("Egy 30 fős osztály");
  const modePicker = make("div", "il-controls");
  const sliderBox = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", role: "img", "aria-label": "Halmazábra a 30 gyerekkel" });
  const circles = svg("g", {}, figure);
  const dots = Array.from({ length: TOTAL }, () => {
    const dot = svg("circle", { r: DOT, class: "il-move" }, figure);
    return dot;
  });
  const numbers = svg("g", { style: "pointer-events:none" }, figure);
  const formula = make("div", "il-formula start");
  formula.style.lineHeight = "2";
  const message = make("p", "il-message");
  const runButton = button("Számoljuk meg!", run);
  play.append(modePicker, sliderBox, figure, formula, controls(runButton, button("Újra", () => { stop(); render(); }, { ghost: true })), message);
  root.append(play, keyIdea("az elemszámot nem szabad egyszerűen összeadni, ha a halmazok átfedik egymást: az összegből ki kell vonni a közös részt. Három halmaznál a közös részeket levonjuk, a mindhárom közös részét pedig visszaadjuk."));

  const geometry = () => GEOMETRY[state.mode];
  const regionOf = (x, y) => SETS.slice(0, state.mode).map((set, i) => (Math.hypot(x - geometry().centers[i].x, y - geometry().centers[i].y) < geometry().radius ? set.key : "")).join("");

  function slotsFor() {
    const { height, radius, centers } = geometry();
    const samples = new Map();
    for (let y = 12; y < height - 6; y += 3) {
      for (let x = 10; x < W - 10; x += 3) {
        const key = regionOf(x, y);
        const edge = Math.min(...centers.map((c) => Math.abs(Math.hypot(x - c.x, y - c.y) - radius)));
        if (edge < DOT + 3) continue;
        (samples.get(key) ?? samples.set(key, []).get(key)).push({ x, y });
      }
    }
    const result = new Map();
    for (const [key, points] of samples) {
      const cx = points.reduce((s, p) => s + p.x, 0) / points.length, cy = points.reduce((s, p) => s + p.y, 0) / points.length;
      const anchor = key === "" ? { x: 540, y: height / 2 } : { x: cx, y: cy };
      const ordered = points.sort((p, q) => Math.hypot(p.x - anchor.x, p.y - anchor.y) - Math.hypot(q.x - anchor.x, q.y - anchor.y));
      const chosen = [];
      for (const p of ordered) {
        if (chosen.every((c) => Math.hypot(c.x - p.x, c.y - p.y) >= 2 * DOT + 4)) chosen.push(p);
        if (chosen.length >= 30) break;
      }
      result.set(key, chosen.length ? chosen : [anchor]);
    }
    return result;
  }

  function stop() { scope.clearAll(); state.running = false; state.step = 0; message.textContent = ""; message.className = "il-message"; }

  function setValues(key, value) {
    state[key] = value;
    if (state.mode === 2) {
      state.both = Math.min(Math.max(state.both, Math.max(0, state.f + state.s - TOTAL)), Math.min(state.f, state.s));
    }
    stop();
    render();
  }

  const stepsFor = (counts) => {
    if (state.mode === 2) {
      const { f, s, both } = state;
      return [
        { text: "Összeszámoljuk az F kör tagjait.", total: f },
        { text: `Hozzáadjuk az S kör tagjait. A közös ${both} gyerek (sárga) kétszer szerepel az összegben!`, total: f + s },
        { text: `Ezért a közös részt egyszer levonjuk: ${f + s} − ${both} = ${f + s - both}. Most már mindenki pontosan egyszer van benne.`, total: f + s - both },
      ];
    }
    const { triple: t } = state;
    const singles = 15 + 12 + 10, pairs = 6 + 5 + 4;
    return [
      { text: "Először összeadjuk a három kör tagjait. Aki több körben is benne van, többször számolódik (sárga).", total: singles },
      { text: "Levonjuk a páros átfedéseket. A mindhárom körben lévők háromszor kerültek be, most háromszor ki is vettük őket: ők most nulla.", total: singles - pairs },
      { text: "A mindhárom körben lévőket visszaadjuk egyszer. Így mindenki pontosan egyszer szerepel.", total: singles - pairs + t },
    ];
  };

  function run() {
    stop();
    state.running = true;
    const steps = stepsFor();
    const go = (i) => {
      if (i >= steps.length) { state.running = false; message.className = "il-message good"; return render(); }
      state.step = i + 1;
      render();
      scope.timeout(() => go(i + 1), 2600);
    };
    go(0);
  }

  function render() {
    const { height, radius, centers } = geometry();
    const letters = SETS.slice(0, state.mode);
    figure.setAttribute("viewBox", `0 0 ${W} ${height}`);
    modePicker.replaceChildren(toggle("2 halmaz", state.mode === 2, () => { stop(); state.mode = 2; render(); }), toggle("3 halmaz", state.mode === 3, () => { stop(); state.mode = 3; render(); }));

    // Sliders are rebuilt only when their structure changes, to keep dragging smooth.
    const signature = `${state.mode}`;
    if (sliderBox.dataset.signature !== signature) {
      sliderBox.dataset.signature = signature;
      sliderBox.replaceChildren();
      sliders = {};
      const add = (key, label, min, max) => { sliders[key] = range({ label, min, max, value: state[key], format: String, onInput: (v) => setValues(key, v) }); sliderBox.append(sliders[key].element); };
      if (state.mode === 2) { add("f", "|F| focisták", 0, TOTAL); add("s", "|S| sakkozók", 0, TOTAL); add("both", "|F ∩ S| mindkettő", 0, TOTAL); }
      else add("triple", "|F ∩ S ∩ T| mindhárom", 0, 4);
    }
    if (state.mode === 2) {
      sliders.both.input.min = Math.max(0, state.f + state.s - TOTAL);
      sliders.both.input.max = Math.min(state.f, state.s);
      sliders.both.set(state.both);
    }

    circles.replaceChildren();
    numbers.replaceChildren();
    letters.forEach((set, i) => {
      svg("circle", { cx: centers[i].x, cy: centers[i].y, r: radius, style: `fill:${set.color};fill-opacity:.1;stroke:${set.color};stroke-width:2.5` }, circles);
      const labelX = i === 2 ? centers[i].x + radius + 10 : centers[i].x + (i === 0 ? -radius * 0.6 : radius * 0.6);
      const labelY = i === 2 ? centers[i].y + radius * 0.55 : centers[i].y - radius - 6;
      svg("text", { x: labelX, y: labelY, "text-anchor": i === 2 ? "start" : "middle", "font-weight": 700, text: `${set.key}: ${set.name}`, style: `fill:${set.color}` }, circles);
    });

    const counts = regionCounts(state.mode, state);
    const slots = slotsFor();
    const used = new Map();
    const order = Object.keys(counts);
    let dotIndex = 0;
    const step = state.step;
    for (const key of order) {
      const list = slots.get(key) ?? [{ x: 40, y: 40 }];
      for (let k = 0; k < counts[key]; k++) {
        const used_ = used.get(key) ?? 0;
        used.set(key, used_ + 1);
        const slotPoint = list[used_ % list.length];
        const dot = dots[dotIndex++];
        dot.style.transform = `translate(${slotPoint.x + (used_ >= list.length ? 4 : 0)}px, ${slotPoint.y + (used_ >= list.length ? 4 : 0)}px)`;
        dot.setAttribute("opacity", 1);
        Object.assign(dot.style, dotStyle(key, step));
      }
    }
    labelRegions(counts, slots);

    formula.replaceChildren(...formulaParts(counts));
    const current = state.step ? stepsFor()[state.step - 1].text : "Állítsd be a számokat, aztán nézd végig a számolást. A körökben lévő pontok a gyerekek.";
    message.textContent = current;
    message.className = `il-message ${state.step === 3 && !state.running ? "good" : ""}`;
    runButton.disabled = state.running;
  }
  let sliders = {};

  function dotStyle(key, step) {
    const letters = key.split("").filter(Boolean);
    const colourOf = (k) => SETS.find((set) => set.key === k).color;
    const base = letters.length === 0 ? "var(--dim)" : letters.length === 1 ? colourOf(letters[0]) : letters.length === 2 ? "var(--il-green)" : "var(--il-pink)";
    let fill = base, stroke = "none", opacity = 1;
    if (state.mode === 2) {
      if (step === 1) { if (!key.includes("F")) opacity = 0.25; }
      if (step === 2) { if (key === "FS") fill = "var(--il-amber)"; else if (key === "") opacity = 0.25; }
      if (step === 3) { if (key === "FS") { fill = "var(--il-amber)"; stroke = "var(--il-red)"; } else if (key === "") opacity = 0.25; }
    } else {
      if (step === 1 && letters.length >= 2) fill = "var(--il-amber)";
      if (step === 1 && key === "") opacity = 0.25;
      if (step === 2) { if (letters.length === 3) { fill = "var(--il-amber)"; stroke = "var(--il-red)"; } if (key === "") opacity = 0.25; }
      if (step === 3 && key === "") opacity = 0.25;
    }
    return { fill, stroke, strokeWidth: "2", opacity: String(opacity) };
  }

  function labelRegions(counts, slots) {
    numbers.replaceChildren();
    const { height, centers, radius } = geometry();
    const anchorOf = (key) => {
      if (key === "") return { x: 560, y: height - 16 };
      const parts = key.split("");
      const cs = parts.map((k) => centers[SETS.findIndex((set) => set.key === k)]);
      const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cy = cs.reduce((s, c) => s + c.y, 0) / cs.length;
      const all = centers.slice(0, state.mode);
      const mx = all.reduce((s, c) => s + c.x, 0) / all.length, my = all.reduce((s, c) => s + c.y, 0) / all.length;
      const push = parts.length === all.length ? 0 : (parts.length === 1 ? radius * 0.55 : 0);
      const dx = cx - mx, dy = cy - my, len = Math.hypot(dx, dy) || 1;
      return { x: cx + (dx / len) * push, y: cy + (dy / len) * push };
    };
    for (const key of Object.keys(counts)) {
      const a = anchorOf(key);
      svg("text", { x: a.x, y: a.y - 18, "text-anchor": "middle", "font-weight": 700, text: String(counts[key]), style: "font-size:15px;fill:var(--fg)" }, numbers);
    }
  }

  function formulaParts(counts) {
    const n = (value, dim = false) => slot(String(value), 3, { dim });
    const visible = (from) => state.step >= from || state.step === 0;
    const wrap = (...parts) => { const line = make("div"); line.append(...parts); return line; };
    const union = TOTAL - counts[""];
    if (state.mode === 2) {
      const { f, s, both } = state;
      return [
        wrap("|F ∪ S| = |F| + |S| − |F ∩ S|"),
        wrap("|F ∪ S| = ", n(f, !visible(1)), " + ", n(s, !visible(2)), " − ", n(both, !visible(3)), " = ", n(union, state.step < 3 && state.step !== 0)),
      ];
    }
    const { triple: t } = state;
    return [
      wrap("|F ∪ S ∪ T| = |F| + |S| + |T| − |F ∩ S| − |F ∩ T| − |S ∩ T| + |F ∩ S ∩ T|"),
      wrap("= ", n(15, !visible(1)), " + ", n(12, !visible(1)), " + ", n(10, !visible(1)), " − ", n(6, !visible(2)), " − ", n(5, !visible(2)), " − ", n(4, !visible(2)), " + ", n(t, !visible(3)), " = ", n(union, state.step < 3 && state.step !== 0)),
      wrap(make("span", "il-muted", "(a három halmaz mérete: F = 15, S = 12, T = 10; F ∩ S = 6, F ∩ T = 5, S ∩ T = 4)")),
    ];
  }

  render();
  return () => scope.clearAll();
}
