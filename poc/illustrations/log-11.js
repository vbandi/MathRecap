import { card, controls, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const SCENES = [
  { rain: false, wet: false, keeps: true, text: "Nem esik, az út száraz. Az ígéret az esős esetre szólt, ezt nem szegi meg." },
  { rain: true, wet: false, keeps: false, text: "Esik, mégis száraz az úttest: pontosan ez szegi meg az ígéretet!" },
  { rain: true, wet: true, keeps: true, text: "Esik, és vizes az út: az ígéret teljesül." },
  { rain: false, wet: true, keeps: true, text: "Nem esik, de vizes az út (például locsoltak). Az ígéret nem mondta, hogy csak esőtől lehet vizes, ezért ezt sem szegi meg." },
];
const MODES = [
  { name: "Ha n osztható 4-gyel, akkor páros", p: "4-gyel osztható", q: "páros", pTest: (n) => n % 4 === 0, qTest: (n) => n % 2 === 0, equal: false },
  { name: "n osztható 6-tal ⇔ n osztható 2-vel és 3-mal", p: "6-tal osztható", q: "2-vel és 3-mal osztható", pTest: (n) => n % 6 === 0, qTest: (n) => n % 2 === 0 && n % 3 === 0, equal: true },
];
const NUMBERS = Array.from({ length: 24 }, (_, i) => i + 1);
const GEOMETRY = {
  nested: { q: { cx: 220, cy: 130, rx: 205, ry: 110 }, p: { cx: 150, cy: 130, rx: 112, ry: 70 } },
  equal: { q: { cx: 170, cy: 130, rx: 122, ry: 78 }, p: { cx: 170, cy: 130, rx: 110, ry: 66 } },
};
const CHIP = 13;

const inside = (e, x, y, pad = 0) => ((x - e.cx) / (e.rx - pad)) ** 2 + ((y - e.cy) / (e.ry - pad)) ** 2 < 1;

export function mount(root) {
  const state = { checked: new Map(), mode: 0, focus: null };

  root.append(lead("A „ha A, akkor B” egy ígéret: ha A teljesül, akkor B-nek is teljesülnie kell. Az ígéretet pontosan akkor szegjük meg, ha A igaz, B viszont nem. Az első játékban ezt keresd meg."));

  const scenes = card("Ha esik az eső, akkor vizes az úttest");
  const sceneSvg = svg("svg", { class: "il-svg", viewBox: "0 0 620 230", role: "group", "aria-label": "Négy jelenet: esik vagy nem esik, vizes vagy száraz az út" });
  const sceneMessage = make("p", "il-message");
  SCENES.forEach((scene, i) => {
    const x = 6 + i * 152;
    const group = svg("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": `${scene.rain ? "Esik" : "Nem esik"}, ${scene.wet ? "vizes" : "száraz"} az út` }, sceneSvg);
    svg("rect", { x, y: 8, width: 146, height: 190, rx: 12, class: "frame", style: "fill:var(--surface);stroke:var(--line-strong);stroke-width:2" }, group);
    if (scene.rain) {
      svg("path", { d: `M ${x + 35} 62 a 20 20 0 0 1 10 -36 a 26 26 0 0 1 50 4 a 18 18 0 0 1 8 32 z`, style: "fill:var(--dim)" }, group);
      [0, 1, 2, 3].forEach((k) => svg("line", { x1: x + 48 + k * 16, y1: 72, x2: x + 42 + k * 16, y2: 92, style: `stroke:${PALETTE.blue};stroke-width:3;stroke-linecap:round` }, group));
    } else {
      svg("circle", { cx: x + 73, cy: 55, r: 20, style: `fill:${PALETTE.amber}` }, group);
    }
    svg("rect", { x: x + 12, y: 120, width: 122, height: 34, rx: 6, style: `fill:${scene.wet ? "#3b6ea5" : "#6b6356"}` }, group);
    if (scene.wet) svg("ellipse", { cx: x + 73, cy: 137, rx: 38, ry: 7, style: "fill:#9cc7f0;opacity:.7" }, group);
    svg("text", { x: x + 73, y: 176, "text-anchor": "middle", text: `${scene.rain ? "esik" : "nem esik"}, ${scene.wet ? "vizes" : "száraz"}`, style: "font-weight:600" }, group);
    const mark = svg("text", { x: x + 73, y: 222, "text-anchor": "middle", "font-weight": 700 }, sceneSvg);
    scene.mark = mark; scene.frame = group.querySelector(".frame");
    const pick = () => {
      state.checked.set(i, true);
      sceneMessage.textContent = `${scene.text}${scene.keeps ? "" : " ✓ Ez az a jelenet, amit kerestél."}`;
      sceneMessage.className = `il-message ${scene.keeps ? "" : "good"}`;
      renderScenes();
    };
    group.addEventListener("click", pick);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(); } });
  });
  scenes.append(make("p", "il-muted", "Melyik jelenet szegi meg az ígéretet? Kattints rá."), sceneSvg, sceneMessage);

  const sets = card("Elégséges és szükséges feltétel");
  const modePicker = make("div", "il-controls"), focusPicker = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 260", role: "img", "aria-label": "Halmazábra két feltételről" });
  svg("rect", { x: 4, y: 4, width: 612, height: 252, rx: 10, style: "fill:none;stroke:var(--fg-soft);stroke-width:1.5" }, figure);
  const ellipseQ = svg("ellipse", {}, figure), ellipseP = svg("ellipse", {}, figure);
  const labelQ = svg("text", { "font-weight": 700, "text-anchor": "middle", style: `fill:${PALETTE.blue}` }, figure);
  const labelP = svg("text", { "font-weight": 700, "text-anchor": "middle", style: `fill:${PALETTE.violet}` }, figure);
  const chips = NUMBERS.map((n) => {
    const group = svg("g", { class: "il-move" }, figure);
    const circle = svg("circle", { r: CHIP }, group);
    svg("text", { "text-anchor": "middle", dy: 4.5, text: String(n), style: "font-size:12px" }, group);
    return { group, circle };
  });
  const explanation = make("p", "il-message");
  explanation.style.minHeight = "5em";
  sets.append(modePicker, figure, focusPicker, explanation);
  root.append(scenes, sets, keyIdea("a „ha A, akkor B” csak az „A igaz, B hamis” esetben hamis. Ha A elég B-hez, A az elégséges feltétel; ha B nélkül A nem lehet, B a szükséges feltétel. Ha mindkettő igaz egyszerre, ekvivalenciáról beszélünk (⇔)."));

  function renderScenes() {
    SCENES.forEach((scene, i) => {
      const done = state.checked.has(i);
      scene.frame.style.stroke = done ? (scene.keeps ? "var(--il-green)" : "var(--il-red)") : "var(--line-strong)";
      scene.mark.textContent = done ? (scene.keeps ? "az ígéretet betartja" : "az ígéretet megszegi") : "";
      scene.mark.style.fill = scene.keeps ? "var(--il-green)" : "var(--il-red)";
    });
  }

  function renderSets() {
    const mode = MODES[state.mode], geometry = GEOMETRY[mode.equal ? "equal" : "nested"];
    modePicker.replaceChildren(...MODES.map((m, i) => toggle(m.name, state.mode === i, () => { state.mode = i; state.focus = null; renderSets(); })));
    focusPicker.replaceChildren(
      toggle(`„${mode.p}” = elégséges feltétel`, state.focus === "p", () => { state.focus = state.focus === "p" ? null : "p"; renderSets(); }, PALETTE.violet),
      toggle(`„${mode.q}” = szükséges feltétel`, state.focus === "q", () => { state.focus = state.focus === "q" ? null : "q"; renderSets(); }, PALETTE.blue),
    );
    for (const [element, e, colour, focus] of [[ellipseQ, geometry.q, PALETTE.blue, "q"], [ellipseP, geometry.p, PALETTE.violet, "p"]]) {
      Object.entries({ cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry }).forEach(([k, v]) => element.setAttribute(k, v));
      element.setAttribute("style", `fill:${colour};fill-opacity:${state.focus === focus ? 0.28 : 0.07};stroke:${colour};stroke-width:2.5;${mode.equal && focus === "q" ? "stroke-dasharray:6 4;" : ""}transition:fill-opacity .3s`);
    }
    const q = geometry.q, p = geometry.p;
    labelQ.textContent = mode.equal ? `Q: ${mode.q}` : `Q: ${mode.q}`;
    labelQ.setAttribute("x", q.cx); labelQ.setAttribute("y", q.cy - q.ry - 6);
    labelP.textContent = mode.equal ? `P: ${mode.p}` : `P: ${mode.p}`;
    labelP.setAttribute("x", p.cx); labelP.setAttribute("y", p.cy + p.ry + (mode.equal ? 30 : 18));
    if (mode.equal) labelQ.setAttribute("y", q.cy - q.ry - 6);

    const slots = { p: [], q: [], out: [] };
    for (let y = 22; y < 246; y += 32) {
      for (let x = 24; x < 600; x += 34) {
        const fullyP = inside(p, x, y, CHIP + 2), nearP = inside(p, x, y, -(CHIP + 2));
        const fullyQ = inside(q, x, y, CHIP + 2), nearQ = inside(q, x, y, -(CHIP + 2));
        if (fullyP) slots.p.push({ x, y, d: Math.hypot(x - p.cx, y - p.cy) });
        else if (!nearP && fullyQ) slots.q.push({ x, y, d: Math.hypot(x - (q.cx + q.rx * 0.45), y - q.cy) });
        else if (!nearQ && !nearP) slots.out.push({ x, y, d: Math.hypot(x - 500, y - 130) });
      }
    }
    for (const list of Object.values(slots)) list.sort((a, b) => a.d - b.d);
    const used = { p: 0, q: 0, out: 0 };
    NUMBERS.forEach((n, i) => {
      const inP = mode.pTest(n), inQ = mode.qTest(n);
      const region = inP ? "p" : inQ && !mode.equal ? "q" : inQ ? "p" : "out";
      const slot = slots[region][used[region]++];
      chips[i].group.style.transform = `translate(${slot.x}px, ${slot.y}px)`;
      const hot = (state.focus === "p" && inP) || (state.focus === "q" && inQ);
      chips[i].circle.setAttribute("style", `fill:${hot ? "var(--accent)" : "var(--surface)"};stroke:${hot ? "none" : "var(--line-strong)"}`);
    });
    const missP = NUMBERS.find((n) => mode.qTest(n) && !mode.pTest(n));
    if (state.focus === null) explanation.textContent = mode.equal ? "P és Q ugyanazokat a számokat adja, a két halmaz egybeesik. Kattints a gombokra: a két feltétel egymásnak elégséges és szükséges is." : "Belül a P, kívül a Q. P teljes egészében Q-ban van: ami P-ben van, az biztosan Q-ban is. Kattints a gombokra.";
    else if (mode.equal) explanation.textContent = "Mindkét feltétel elégséges és szükséges is a másikhoz: ha az egyik teljesül, a másik is, és fordítva. Ez az ekvivalencia, P ⇔ Q.";
    else if (state.focus === "p") explanation.textContent = `Elég, ha n ${mode.p}: akkor biztosan ${mode.q} is. A P minden eleme Q-ban van. Ezért P elégséges feltétele Q-nak. Fordítva nem igaz: a ${missP} ${mode.q}, de nem ${mode.p}.`;
    else explanation.textContent = `Ha n nem ${mode.q}, akkor biztosan nem ${mode.p}. A Q-n kívüli számok nem lehetnek P-ben. Ezért „${mode.q}” szükséges feltétele a P-nek, de nem elég hozzá.`;
  }

  renderScenes();
  renderSets();
  return () => {};
}
