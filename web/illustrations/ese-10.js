import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, slot, stepper, svg, toggle } from "./kit.js";

const LETTERS = "ABCDEFGH";
const WIDTH = 640, HEIGHT = 300;
const NAMES = ["Anna", "Bence", "Csilla", "Dani", "Eszter", "Feri", "Gabi", "Hanna"];

const circlePoints = (n, cx, cy, r) => Array.from({ length: n }, (_, i) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
});
const allPairs = (n) => { const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]); return pairs; };

function node(parent, point, label, color, radius = 17) {
  const group = svg("g", {}, parent);
  const circle = svg("circle", { cx: point.x, cy: point.y, r: radius, fill: color, stroke: "var(--bg)", "stroke-width": 2 }, group);
  svg("text", { x: point.x, y: point.y + 5, "text-anchor": "middle", text: label, style: "fill:#fff;font-weight:700;font-size:14px" }, group);
  return { group, circle };
}

export function mount(root) {
  const scope = createScope();
  let scenario = "handshake";
  let cleanup = () => {};

  root.append(lead("A gráf nemcsak rajz: modell. Ha egy helyzetben vannak szereplők és köztük kapcsolatok (kézfogás, meccs, út), akkor a szereplők lesznek a csúcsok, a kapcsolatok az élek, és a számolás gráfszámolássá válik."));
  const scenarioControls = controls();
  const body = make("div");
  root.append(scenarioControls, body, keyIdea("ha a szereplők bármelyik két tagja között van kapcsolat (kézfogás, körmérkőzés), az n csúcsú teljes gráfot kapjuk, amelynek n · (n − 1) / 2 éle van. Útvonalaknál a gráf segít rendszerezni: minden út egy csúcssorozat."));

  const scenarios = [["handshake", "Kézfogás", mountHandshake], ["roundrobin", "Körmérkőzés", mountRoundRobin], ["routes", "Útvonalak", mountRoutes]];
  function render() {
    cleanup(); scope.clearAll();
    body.replaceChildren();
    scenarioControls.replaceChildren(...scenarios.map(([id, label]) => toggle(label, scenario === id, () => { scenario = id; render(); })));
    cleanup = scenarios.find(([id]) => id === scenario)[2](body);
  }

  // ---------- handshakes ----------
  function mountHandshake(target) {
    let n = 5, done = 0, timer = null;
    const panel = card("Mindenki kezet fog mindenkivel");
    const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Kézfogások gráfja" });
    const counter = make("div", "il-formula start");
    const message = make("p", "il-message");
    panel.append(controls(
      stepper({ label: "Emberek száma", min: 2, max: 8, value: n, onChange: (value) => { n = value; restart(); } }).element,
      button("Újra", () => restart()), button("Mind", () => { stop(); done = pairs().length; draw(); }, { ghost: true }),
    ), figure, counter, message);
    target.append(panel);
    const pairs = () => allPairs(n);
    const stop = () => { if (timer !== null) { scope.clearInterval(timer); timer = null; } };
    function restart() {
      stop(); done = 0; draw();
      timer = scope.interval(() => { done += 1; draw(); if (done >= pairs().length) stop(); }, 450);
    }
    function draw() {
      figure.replaceChildren();
      const points = circlePoints(n, 320, 150, 110);
      pairs().slice(0, done).forEach(([a, b], index) => {
        const newest = index === done - 1 && timer !== null;
        svg("line", { x1: points[a].x, y1: points[a].y, x2: points[b].x, y2: points[b].y, stroke: newest ? PALETTE.amber : "var(--accent)", "stroke-width": newest ? 5 : 2.5, "stroke-linecap": "round" }, figure);
      });
      points.forEach((point, i) => {
        node(figure, point, LETTERS[i], PALETTE.blue);
        const labelPoint = { x: 320 + 140 * (point.x - 320) / 110, y: 150 + 138 * (point.y - 150) / 110 };
        svg("text", { x: labelPoint.x, y: labelPoint.y + 4, "text-anchor": "middle", text: NAMES[i], style: "fill:var(--dim);font-size:12px" }, figure);
      });
      const total = pairs().length;
      counter.replaceChildren(`${n} · ${n - 1} / 2 = `, make("b", "", String(total)), " kézfogás · eddig: ", slot(String(done), 3, { align: "left" }));
      message.textContent = done < total ? "Minden csúcspárhoz egy kézfogás (él) tartozik." : `Mindenki ${n - 1} kezet fog, ez ${n} · ${n - 1} = ${n * (n - 1)} kézfogás-fél, de egy kézfogásnak két fele van. Ezért osztunk 2-vel: ${total} kézfogás.`;
    }
    restart();
    return () => {};
  }

  // ---------- round-robin table and graph ----------
  function mountRoundRobin(target) {
    let n = 4, played = new Set(), hover = null;
    const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
    const panel = card("Körmérkőzés: táblázat és gráf ugyanaz");
    const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Körmérkőzés táblázata és gráfja" });
    const counter = make("div", "il-formula start");
    const message = make("p", "il-message");
    panel.append(controls(
      stepper({ label: "Csapatok száma", min: 3, max: 6, value: n, onChange: (value) => { n = value; played = new Set(); draw(); } }).element,
      button("Minden meccs lejátszva", () => { played = new Set(allPairs(n).map(([a, b]) => key(a, b))); draw(); }),
      button("Törlés", () => { played = new Set(); draw(); }, { ghost: true }),
    ), make("p", "il-muted", "Kattints egy táblázat-cellára vagy egy gráf-élre (vagy két csúcs közé): a mérkőzés lejátszottnak számít. Mindkét ábra ugyanazt mutatja."), figure, counter, message);
    target.append(panel);
    function draw() {
      figure.replaceChildren();
      const cell = Math.min(40, 280 / (n + 1)), x0 = 20, y0 = 20;
      const points = circlePoints(n, 470, 150, 105);
      const pairs = allPairs(n);
      pairs.forEach(([a, b]) => {
        const on = played.has(key(a, b)), hot = hover === key(a, b);
        const line = svg("line", { x1: points[a].x, y1: points[a].y, x2: points[b].x, y2: points[b].y, stroke: hot ? PALETTE.amber : on ? "var(--accent)" : "var(--line)", "stroke-width": on || hot ? 4 : 2, "stroke-dasharray": on ? "" : "5 5", style: "cursor:pointer" }, figure);
        line.addEventListener("click", () => toggleMatch(a, b));
        line.addEventListener("pointerenter", () => { hover = key(a, b); draw(); });
        line.addEventListener("pointerleave", () => { hover = null; draw(); });
      });
      points.forEach((point, i) => node(figure, point, LETTERS[i], PALETTE.violet));
      for (let i = 0; i < n; i++) {
        svg("text", { x: x0 + (i + 1.5) * cell, y: y0 + cell / 2 + 4, "text-anchor": "middle", text: LETTERS[i], style: `fill:${PALETTE.violet};font-weight:700` }, figure);
        svg("text", { x: x0 + cell / 2, y: y0 + (i + 1.5) * cell + 4, "text-anchor": "middle", text: LETTERS[i], style: `fill:${PALETTE.violet};font-weight:700` }, figure);
        for (let j = 0; j < n; j++) {
          const x = x0 + (j + 1) * cell, y = y0 + (i + 1) * cell;
          const same = i === j, on = played.has(key(i, j)), hot = hover === key(i, j);
          const rect = svg("rect", { x: x + 1, y: y + 1, width: cell - 2, height: cell - 2, rx: 6, fill: same ? "none" : on ? "var(--accent-soft)" : "var(--surface)", stroke: hot ? PALETTE.amber : on ? "var(--accent)" : "var(--line)", "stroke-width": hot ? 3 : 1, style: same ? "" : "cursor:pointer" }, figure);
          svg("text", { x: x + cell / 2, y: y + cell / 2 + 5, "text-anchor": "middle", text: same ? "" : on ? "✓" : "", style: "fill:var(--accent);font-weight:700;pointer-events:none" }, figure);
          if (!same) {
            rect.addEventListener("click", () => toggleMatch(i, j));
            rect.addEventListener("pointerenter", () => { hover = key(i, j); draw(); });
            rect.addEventListener("pointerleave", () => { hover = null; draw(); });
          }
        }
      }
      const total = pairs.length;
      counter.replaceChildren(`${n} csapat, ${n} · ${n - 1} / 2 = `, make("b", "", String(total)), " mérkőzés · lejátszva: ", slot(String(played.size), 3, { align: "left" }));
      message.textContent = played.size === total
        ? "Minden csapat játszott mindenkivel: teljes gráf. A táblázatban minden mérkőzés kétszer szerepel (A–B és B–A), a gráfban csak egyszer."
        : "A táblázat a főátló két oldalán tükrös (A–B és B–A ugyanaz a meccs), a gráfban ezt egyetlen él jelenti.";
    }
    function toggleMatch(a, b) {
      const id = key(a, b);
      if (played.has(id)) played.delete(id); else played.add(id);
      draw();
    }
    draw();
    return () => {};
  }

  // ---------- routes on a map ----------
  function mountRoutes(target) {
    const towns = [
      { name: "H", label: "Otthon", x: 70, y: 150 }, { name: "A", x: 210, y: 60 }, { name: "B", x: 210, y: 240 },
      { name: "C", x: 380, y: 70 }, { name: "D", x: 380, y: 230 }, { name: "S", label: "Iskola", x: 570, y: 150 },
    ];
    const roads = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5]];
    const neighbours = (v) => roads.filter(([a, b]) => a === v || b === v).map(([a, b]) => (a === v ? b : a));
    const routes = [];
    (function search(path) {
      const last = path[path.length - 1];
      if (last === 5) { routes.push(path); return; }
      for (const next of neighbours(last)) if (!path.includes(next)) search([...path, next]);
    })([0]);
    let route = [0], found = new Set(), highlighted = null;
    const panel = card("Hányféleképp juthatunk el az Otthonból az Iskolába?");
    const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Úthálózat gráfja" });
    const counter = make("div", "il-formula start");
    const list = make("div", "il-controls");
    const message = make("p", "il-message");
    panel.append(make("p", "il-muted", "A városok a csúcsok, az utak az élek. Egy útvonalon egy várost csak egyszer érinthetünk. Kattints az Otthonra, majd a szomszédos városokra egymás után, amíg az Iskolába nem érsz."),
      controls(button("Újrakezdem az útvonalat", () => { route = [0]; highlighted = null; draw(); }, { ghost: true }), button("Mutasd az összeset", () => { routes.forEach((r) => found.add(r.join(""))); draw(); })),
      figure, counter, list, message);
    target.append(panel);
    const edgeOn = (a, b, path) => path.some((v, i) => i > 0 && ((path[i - 1] === a && v === b) || (path[i - 1] === b && v === a)));
    function click(index) {
      if (highlighted) { highlighted = null; route = [0]; }
      const last = route[route.length - 1];
      if (route.length > 1 && index === route[route.length - 2]) route.pop();
      else if (neighbours(last).includes(index) && !route.includes(index) && last !== 5) {
        route.push(index);
        if (index === 5) {
          const id = route.join("");
          message.dataset.fresh = found.has(id) ? "old" : "new";
          found.add(id);
        }
      }
      draw();
    }
    function draw() {
      figure.replaceChildren();
      const shown = highlighted ?? route;
      roads.forEach(([a, b]) => svg("line", { x1: towns[a].x, y1: towns[a].y, x2: towns[b].x, y2: towns[b].y, stroke: edgeOn(a, b, shown) ? "var(--accent)" : "var(--line-strong)", "stroke-width": edgeOn(a, b, shown) ? 6 : 3, "stroke-linecap": "round" }, figure));
      towns.forEach((town, i) => {
        const { group } = node(figure, town, town.name, i === 0 ? PALETTE.green : i === 5 ? PALETTE.red : shown.includes(i) ? PALETTE.amber : PALETTE.blue, 19);
        group.style.cursor = "pointer";
        group.addEventListener("click", () => click(i));
        if (town.label) svg("text", { x: town.x, y: town.y + 40, "text-anchor": "middle", text: town.label, style: "fill:var(--dim);font-size:12px" }, figure);
      });
      counter.replaceChildren("megtalált útvonalak: ", slot(String(found.size), 2, { align: "left" }), ` / ${routes.length}`, " · jelenlegi útvonal: ", make("b", "", shown.map((v) => towns[v].name).join("–")));
      list.replaceChildren(...routes.filter((r) => found.has(r.join(""))).map((r) => {
        const chip = button(r.map((v) => towns[v].name).join("–"), () => { highlighted = r; draw(); }, { ghost: true });
        chip.style.padding = "3px 10px";
        return chip;
      }));
      const reached = !highlighted && route[route.length - 1] === 5;
      message.className = `il-message${reached ? " good" : ""}`;
      message.textContent = found.size === routes.length
        ? `Megvan mind a ${routes.length} útvonal! Kattints egy útvonalra a listában, hogy újra lásd.`
        : reached ? (message.dataset.fresh === "old" ? "Ezt az útvonalat már megtaláltad, keress másikat!" : "Új útvonal! Kezdd elölről, és keress másikat.")
          : "Lépj tovább egy szomszédos városra. Ha zsákutcába jutsz, kattints az előző városra a visszalépéshez.";
    }
    draw();
    return () => {};
  }

  render();
  return () => { cleanup(); scope.clearAll(); };
}
