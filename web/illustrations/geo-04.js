import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380, MARGIN = 18;
const AIM = { given: "var(--fg)", aux: PALETTE.blue, result: PALETTE.green };

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) onMove(...toSvgPoint(figure, event));
  });
}

// --- small vector helpers (screen coordinates, y points down, angles grow clockwise) ---
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const angleOf = (a) => Math.atan2(a[1], a[0]);
const at = (c, r, angle) => [c[0] + r * Math.cos(angle), c[1] + r * Math.sin(angle)];
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const shortDiff = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };

const arcAround = (c, r, center, half, kind = "aux") => ({ type: "arc", c, r, from: center - half, to: center + half, kind });
const arcSpan = (c, r, a, b, kind = "aux") => ({ type: "arc", c, r, from: Math.min(a, b), to: Math.max(a, b), kind });
const arcBetween = (c, r, a, b, kind = "result") => arcSpan(c, r, a, a + shortDiff(a, b), kind);
const segment = (from, to, kind = "given") => ({ type: "segment", from, to, kind });
const fullLine = (p, dir, kind = "given") => ({ type: "line", p, dir, both: true, kind });
const ray = (p, dir, kind = "result") => ({ type: "line", p, dir, both: false, kind });
const dotItem = (p, name, kind = "result", offset = [10, -10]) => ({ type: "dot", p, name, kind, offset });
const rightMark = (corner, u, v, kind = "result") => ({ type: "mark", corner, u, v, kind });

function borderReach(p, dir) {
  const limits = [];
  if (dir[0] > 1e-9) limits.push((WIDTH - p[0]) / dir[0]); else if (dir[0] < -1e-9) limits.push(-p[0] / dir[0]);
  if (dir[1] > 1e-9) limits.push((HEIGHT - p[1]) / dir[1]); else if (dir[1] < -1e-9) limits.push(-p[1] / dir[1]);
  return Math.min(...limits);
}

function itemPath(item) {
  if (item.type === "arc") {
    const [x1, y1] = at(item.c, item.r, item.from), [x2, y2] = at(item.c, item.r, item.to);
    return `M ${x1} ${y1} A ${item.r} ${item.r} 0 ${item.to - item.from > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
  }
  if (item.type === "segment") return `M ${item.from[0]} ${item.from[1]} L ${item.to[0]} ${item.to[1]}`;
  if (item.type === "line") {
    const dir = unit(item.dir);
    const end = add(item.p, mul(dir, borderReach(item.p, dir)));
    const start = item.both ? add(item.p, mul(dir, -borderReach(item.p, mul(dir, -1)))) : item.p;
    return `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`;
  }
  const p1 = add(item.corner, mul(item.u, 12)), p3 = add(item.corner, mul(item.v, 12));
  return `M ${p1[0]} ${p1[1]} L ${add(p1, mul(item.v, 12)).join(" ")} L ${p3[0]} ${p3[1]}`;
}

// Each construction: handles (draggable inputs), fix() keeps the input non-degenerate,
// steps() returns the steps, each with a text and the new items it draws.
const CONSTRUCTIONS = [
  {
    id: "bisector-perpendicular", label: "Szakaszfelező merőleges",
    handles: { A: [150, 240], B: [450, 190] }, apart: [["A", "B", 60]],
    steps({ A, B }) {
      const d = sub(B, A), L = len(d), base = angleOf(d), r = 0.75 * L, theta = Math.acos(0.5 / 0.75);
      const X = at(A, r, base + theta), Y = at(A, r, base - theta), F = mul(add(A, B), 0.5);
      return [
        { text: "Adott az AB szakasz. A körzőt az AB szakasz felénél nagyobbra nyitjuk.", items: [segment(A, B)] },
        { text: "A-ból ívet rajzolunk mindkét oldalra.", items: [arcAround(A, r, base + theta, 0.45), arcAround(A, r, base - theta, 0.45)] },
        { text: "Ugyanazzal a nyílással B-ből is: a négy ív két pontban (X és Y) metszi egymást.", items: [arcAround(B, r, base + Math.PI - theta, 0.45), arcAround(B, r, base + Math.PI + theta, 0.45), dotItem(X, "X"), dotItem(Y, "Y", "result", [10, 18])] },
        { text: "Az XY egyenes felezi az AB szakaszt, és merőleges rá: ez a szakaszfelező merőleges. Minden pontja egyenlő messze van A-tól és B-től.", items: [fullLine(X, sub(Y, X), "result"), dotItem(F, "F", "result", [10, 18]), rightMark(F, unit(d), unit(sub(X, Y)))] },
      ];
    },
  },
  {
    id: "angle-bisector", label: "Szögfelező",
    handles: { O: [170, 310], P: [520, 260], Q: [340, 60] }, apart: [["O", "P", 80], ["O", "Q", 80]],
    steps({ O, P, Q }) {
      const u1 = unit(sub(P, O)), u2 = unit(sub(Q, O));
      const r = clamp(0.5 * Math.min(len(sub(P, O)), len(sub(Q, O))), 40, 120);
      const C = add(O, mul(u1, r)), D = add(O, mul(u2, r));
      const sum = add(u1, u2), bisector = len(sum) > 1e-3 ? unit(sum) : [-u1[1], u1[0]];
      const chord = len(sub(C, D)), s = Math.max(0.75 * chord, 45), M = mul(add(C, D), 0.5);
      const X = add(M, mul(bisector, Math.sqrt(Math.max(0, s * s - chord * chord / 4))));
      const a1 = angleOf(u1), a2 = angleOf(u2), ab = angleOf(bisector);
      return [
        { text: "Adott az O csúcsú szög. Az O-ból húzott ív mindkét szárat elmetszi (C és D pont).", items: [segment(O, P), segment(O, Q), arcAround(O, r, a1, 0.25), arcAround(O, r, a2, 0.25), dotItem(C, "C", "aux"), dotItem(D, "D", "aux")] },
        { text: "C-ből, majd D-ből ugyanazzal a nyílással íveket rajzolunk (a nyílás nagyobb, mint CD fele). Metszéspontjuk X.", items: [arcAround(C, s, angleOf(sub(X, C)), 0.4), arcAround(D, s, angleOf(sub(X, D)), 0.4), dotItem(X, "X")] },
        { text: "Az O-ból X-en át húzott félegyenes a szögfelező: két egyenlő szögre osztja az eredeti szöget.", items: [ray(O, bisector), arcBetween(O, r * 0.55, a1, ab), arcBetween(O, r * 0.7, ab, a2)] },
      ];
    },
  },
  {
    id: "perpendicular-from-point", label: "Merőleges pontból",
    handles: { A: [80, 290], B: [520, 240], P: [330, 90] }, apart: [["A", "B", 80]],
    fix(inputs) { pushOffLine(inputs, "P", "A", "B", 24); },
    steps({ A, B, P }) {
      const u = unit(sub(B, A)), n = [-u[1], u[0]], h = dot(sub(P, A), n), F = sub(P, mul(n, h));
      const r = Math.abs(h) + 45, w = Math.sqrt(r * r - h * h);
      const C = sub(F, mul(u, w)), D = add(F, mul(u, w)), Q = sub(F, mul(n, Math.sign(h) * 60)), r2 = Math.hypot(w, 60);
      return [
        { text: "Adott az e egyenes és a rajta kívüli P pont.", items: [fullLine(A, u)] },
        { text: "P-ből olyan ívet rajzolunk, amely az egyenest két pontban metszi (C és D).", items: [arcAround(P, r, angleOf(sub(C, P)), 0.3), arcAround(P, r, angleOf(sub(D, P)), 0.3), dotItem(C, "C", "aux", [-14, 20]), dotItem(D, "D", "aux", [6, 20])] },
        { text: "C-ből és D-ből ugyanazzal a nyílással íveket rajzolunk az egyenes másik oldalán. Metszéspontjuk Q.", items: [arcAround(C, r2, angleOf(sub(Q, C)), 0.3), arcAround(D, r2, angleOf(sub(Q, D)), 0.3), dotItem(Q, "Q", "aux", [10, 16])] },
        { text: "A PQ egyenes merőleges az e egyenesre, és átmegy a P ponton. A metszéspont (T) a P pont vetülete az egyenesen.", items: [fullLine(P, sub(Q, P), "result"), dotItem(F, "T", "result", [10, -8]), rightMark(F, u, unit(sub(P, F)))] },
      ];
    },
  },
  {
    id: "parallel", label: "Párhuzamos",
    handles: { A: [100, 300], B: [500, 260], P: [210, 110] }, apart: [["A", "B", 80]],
    fix(inputs) { pushOffLine(inputs, "P", "A", "B", 30); },
    steps({ A, B, P }) {
      const u = unit(sub(B, A)), r = len(sub(P, A)), C = add(A, mul(u, r)), D = add(P, mul(u, r));
      const angleAB = angleOf(u), angleAP = angleOf(sub(P, A));
      return [
        { text: "Adott az AB egyenes és a rajta kívüli P pont. Összekötjük P-t az A ponttal.", items: [fullLine(A, u), segment(A, P, "aux")] },
        { text: "A körzőt AP nyílásra állítjuk, és A-ból ívet rajzolunk: ez az egyenest C-ben metszi.", items: [arcAround(A, r, angleAB, 0.3), dotItem(C, "C", "aux", [6, 20])] },
        { text: "Ugyanazzal a nyílással P-ből és C-ből is íveket rajzolunk. Metszéspontjuk D.", items: [arcAround(P, r, angleAB, 0.3), arcAround(C, r, angleAP, 0.3), dotItem(D, "D")] },
        { text: "A PD egyenes párhuzamos AB-vel: az APDC négyszög rombusz (minden oldala r), a szemközti oldalai párhuzamosak.", items: [fullLine(P, u, "result"), segment(C, D, "aux"), segment(P, D, "aux")] },
      ];
    },
  },
  {
    id: "copy-angle", label: "Szögmásolás",
    handles: { O: [90, 190], P: [280, 80], Q: [270, 310], V: [360, 190], R: [560, 190] }, apart: [["O", "P", 80], ["O", "Q", 80], ["V", "R", 100]],
    steps({ O, P, Q, V, R }) {
      const u1 = unit(sub(P, O)), u2 = unit(sub(Q, O)), w = unit(sub(R, V));
      const alpha = Math.acos(clamp(dot(u1, u2), -1, 1)), s = cross(u1, u2) >= 0 ? 1 : -1;
      const r = clamp(0.5 * Math.min(len(sub(P, O)), len(sub(Q, O)), len(sub(R, V))), 30, 110);
      const C = add(O, mul(u1, r)), D = add(O, mul(u2, r)), R1 = add(V, mul(w, r));
      const aw = angleOf(w), S = at(V, r, aw + s * alpha), chord = len(sub(C, D));
      return [
        { text: "Adott az O csúcsú szög és az új félegyenes (V kezdőponttal). Az O-ból ívet rajzolunk, ami a szárakat a C és D pontban metszi.", items: [segment(O, P), segment(O, Q), segment(V, R), arcAround(O, r, angleOf(u1), 0.25), arcAround(O, r, angleOf(u2), 0.25), dotItem(C, "C", "aux"), dotItem(D, "D", "aux")] },
        { text: "Ugyanazzal a nyílással V-ből is ívet rajzolunk, ami a félegyenest E pontban metszi.", items: [arcSpan(V, r, aw - s * 0.25, aw + s * (alpha + 0.25)), dotItem(R1, "E", "aux", [6, 20])] },
        { text: "A körzőt CD nyílásra állítjuk (ennyi a két szár közötti „távolság”), és E-ből ívet rajzolunk: ez az előző ívet F-ben metszi.", items: [segment(C, D, "aux"), arcAround(R1, chord, angleOf(sub(S, R1)), 0.3), dotItem(S, "F")] },
        { text: "A V-ből F-en át húzott félegyenes az eredetivel egyenlő szöget zár be az új félegyenessel. A két háromszög (OCD és VEF) oldalai páronként egyenlők, ezért a szögek is.", items: [ray(V, sub(S, V)), segment(R1, S, "aux"), arcBetween(O, r * 0.6, angleOf(u1), angleOf(u2)), arcBetween(V, r * 0.6, aw, aw + s * alpha)] },
      ];
    },
  },
];

// Keeps handle `key` at least `distance` away from the line through a and b.
function pushOffLine(inputs, key, a, b, distance) {
  const u = unit(sub(inputs[b], inputs[a])), n = [-u[1], u[0]], h = dot(sub(inputs[key], inputs[a]), n);
  if (Math.abs(h) < distance) inputs[key] = add(inputs[key], mul(n, (h >= 0 ? distance : -distance) - h));
}

export function mount(root) {
  const scope = createScope();
  const state = { index: 0, step: 0, playing: null, inputs: CONSTRUCTIONS.map((c) => Object.fromEntries(Object.entries(c.handles).map(([k, p]) => [k, [...p]]))) };

  root.append(lead("A klasszikus szerkesztésekhez csak két eszköz kell: vonalzó (egyenes húzásához) és körző (azonos távolságok átmérésére). Nem mérünk számokkal, mégis pontos eredményt kapunk."));

  const main = card("Lépésről lépésre");
  const picker = controls(...CONSTRUCTIONS.map((c, index) => toggle(c.label, index === state.index, () => select(index), PALETTE.blue)));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Körzős-vonalzós szerkesztés" });
  const nextButton = button("Következő lépés", () => advance(1));
  const backButton = button("Előző lépés", () => advance(-1), { ghost: true });
  const playButton = button("Automatikus lejátszás", () => play(), { ghost: true });
  const stepList = make("ol", "il-steps");
  main.append(picker, figure, controls(nextButton, backButton, playButton), stepList, make("p", "il-muted", "A kék pontok húzhatók: a szerkesztés azonnal újraszámolódik a lépéseken át."));
  const drawLayer = svg("g", {}, figure), handleLayer = svg("g", {}, figure);
  root.append(main, keyIdea("a szerkesztés azért működik, mert a körző azonos sugarú köríveket ad: az így kapott pontok egyenlő távolságra vannak a középpontoktól, és ebből következik a felezés, a merőlegesség vagy a párhuzamosság."));

  function current() { return CONSTRUCTIONS[state.index]; }

  function select(index) {
    scope.clearAll(); state.playing = null;
    state.index = index; state.step = 0;
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    handleLayer.replaceChildren();
    for (const key of Object.keys(current().handles)) {
      const group = svg("g", {}, handleLayer);
      svg("circle", { r: 20, fill: "transparent" }, group);
      svg("circle", { r: 7, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2.5` }, group);
      svg("text", { x: -16, y: -10, text: key, "text-anchor": "middle", style: `font-weight:800;fill:${PALETTE.blue}` }, group);
      group.dataset.key = key;
      makeDraggable(figure, group, (x, y) => {
        state.inputs[state.index][key] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)];
        for (const [a, b, min] of current().apart ?? []) {
          const inputs = state.inputs[state.index];
          if ((key === a || key === b) && len(sub(inputs[b], inputs[a])) < min) {
            const other = key === a ? b : a, away = sub(inputs[key], inputs[other]);
            inputs[key] = add(inputs[other], mul(len(away) < 1e-6 ? [1, 0] : unit(away), min));
          }
        }
        current().fix?.(state.inputs[state.index]);
        render(false);
      });
    }
    render(false);
  }

  function advance(delta) {
    scope.clearAll(); state.playing = null;
    const last = current().steps(state.inputs[state.index]).length - 1;
    state.step = clamp(state.step + delta, 0, last);
    render(delta > 0);
  }

  function play() {
    scope.clearAll();
    state.step = 0; render(false);
    const last = current().steps(state.inputs[state.index]).length - 1;
    const tick = () => {
      if (state.step >= last) return;
      state.step += 1; render(true);
      scope.timeout(tick, 2200);
    };
    scope.timeout(tick, 1000);
  }

  function render(animateLast) {
    const construction = current(), inputs = state.inputs[state.index];
    const steps = construction.steps(inputs);
    drawLayer.replaceChildren();
    steps.slice(0, state.step + 1).forEach((step, stepIndex) => {
      const animate = animateLast && stepIndex === state.step && stepIndex > 0;
      for (const item of step.items) {
        const color = AIM[item.kind];
        if (item.type === "dot") {
          const group = svg("g", { class: "il-fade", opacity: animate ? 0 : 1 }, drawLayer);
          svg("circle", { cx: item.p[0], cy: item.p[1], r: 4.5, style: `fill:${color}` }, group);
          svg("text", { x: item.p[0] + item.offset[0], y: item.p[1] + item.offset[1], text: item.name, style: `font-weight:800;fill:${color}` }, group);
          if (animate) scope.frame(() => scope.frame(() => group.setAttribute("opacity", 1)));
          continue;
        }
        const weight = item.kind === "result" ? 3.5 : item.kind === "aux" && item.type === "segment" ? 2 : item.type === "arc" ? 2 : 3;
        const dash = item.kind === "aux" && item.type === "segment" ? "stroke-dasharray:6 5;" : "";
        const path = svg("path", { d: itemPath(item), fill: "none", style: `stroke:${color};stroke-width:${weight};stroke-linecap:round;${dash}` }, drawLayer);
        if (animate && !dash) {
          path.setAttribute("pathLength", 1);
          path.style.strokeDasharray = "1"; path.style.strokeDashoffset = "1";
          path.style.transition = "stroke-dashoffset 1.1s ease-in-out";
          scope.frame(() => scope.frame(() => { path.style.strokeDashoffset = "0"; }));
        }
      }
    });
    for (const group of handleLayer.children) {
      const point = inputs[group.dataset.key];
      group.setAttribute("transform", `translate(${point[0]} ${point[1]})`);
    }
    stepList.replaceChildren(...steps.map((step, index) => {
      const item = make("li", "", step.text);
      item.style.cssText = `opacity:${index > state.step ? 0.35 : 1};font-family:var(--font);font-weight:${index === state.step ? 700 : 400};color:${index === state.step ? "var(--fg)" : "var(--fg-soft)"}`;
      return item;
    }));
    nextButton.disabled = state.step >= steps.length - 1;
    backButton.disabled = state.step <= 0;
  }

  select(0);
  return () => scope.clearAll();
}
