import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const W = 600, H = 310, LEFT = 54, RIGHT = 16, TOP = 16, BOTTOM = 42;

const temperature = (t) => 14 - 7 * Math.cos((Math.PI * (t - 4)) / 12);
const BIKE_POINTS = [[0, 0], [1, 15], [1.5, 15], [2.5, 35], [4.5, 5]];
function bike(t) {
  for (let i = 1; i < BIKE_POINTS.length; i++) {
    const [t0, s0] = BIKE_POINTS[i - 1], [t1, s1] = BIKE_POINTS[i];
    if (t <= t1) return s0 + ((s1 - s0) * (t - t0)) / (t1 - t0);
  }
  return BIKE_POINTS.at(-1)[1];
}

const GRAPHS = {
  temperature: {
    label: "Hőmérséklet egy nap alatt",
    f: temperature, xMax: 24, xStep: 4, yMin: 0, yMax: 24, yStep: 4, xName: "idő (óra)", yName: "hőmérséklet (°C)",
    readout: (t, v) => `${formatNumber(t, 1)} órakor ${formatNumber(v, 1)} °C volt`,
    samples: Array.from({ length: 97 }, (_, i) => i / 4),
    questions: [
      { prompt: "Mikor volt a legmelegebb? Kattints a grafikon legmagasabb pontjára!", hit: (t) => Math.abs(t - 16) < 1.2, marks: [{ point: 16 }], done: "16 órakor volt a legmelegebb, 21 °C. Ez a függvény maximuma: a legnagyobb érték.", hint: "A legmelegebb a legmagasabb pont — nézd, hol van a görbe csúcsa." },
      { prompt: "Mikor volt a leghidegebb? Kattints a legalacsonyabb pontra!", hit: (t) => Math.abs(t - 4) < 1.2, marks: [{ point: 4 }], done: "Hajnali 4 órakor volt a leghidegebb, 7 °C. Ez a minimum: a legkisebb érték.", hint: "A leghidegebb a legalacsonyabb pont." },
      { prompt: "Mikor emelkedett a hőmérséklet? Kattints a grafikonnak arra a szakaszára, ahol felfelé megy a görbe.", hit: (t) => t > 4.6 && t < 15.4, marks: [{ from: 4, to: 16, color: PALETTE.green, text: "nő" }], done: "4 és 16 óra között nőtt: ahogy jobbra haladsz, a görbe egyre magasabbra ér. Ez a növekvő szakasz.", hint: "Olyan részt keress, ahol jobbra haladva a görbe felfelé megy." },
      { prompt: "Mikor csökkent a hőmérséklet? Kattints egy olyan szakaszra, ahol lefelé megy a görbe.", hit: (t) => (t > 0.3 && t < 3.4) || (t > 16.6 && t < 23.7), marks: [{ from: 0, to: 4, color: PALETTE.red, text: "csökken" }, { from: 16, to: 24, color: PALETTE.red, text: "csökken" }], done: "Két szakaszon is csökkent: éjféltől 4 óráig, és 16 órától éjfélig. Ezek a csökkenő szakaszok.", hint: "Olyan részt keress, ahol jobbra haladva a görbe lefelé megy." },
    ],
  },
  bike: {
    label: "Biciklitúra",
    f: bike, xMax: 5, xStep: 1, yMin: 0, yMax: 40, yStep: 10, xName: "idő (óra)", yName: "távolság az otthontól (km)",
    readout: (t, v) => `${formatNumber(t, 1)} óra elteltével ${formatNumber(v, 1)} km-re volt az otthonától`,
    samples: [0, 1, 1.5, 2.5, 4.5, 5],
    questions: [
      { prompt: "Mikor állt meg pihenni a biciklis? Kattints a grafikon vízszintes szakaszára!", hit: (t) => t > 1.05 && t < 1.45, marks: [{ from: 1, to: 1.5, color: PALETTE.amber, text: "áll" }], done: "Egy órától másfél óráig állt: ilyenkor az idő telik, de a távolság nem változik, ezért vízszintes a grafikon.", hint: "Megállás közben az idő telik, de a távolság nem változik." },
      { prompt: "Melyik szakaszon haladt a leggyorsabban? Kattints a legmeredekebb szakaszra!", hit: (t) => t > 1.55 && t < 2.45, marks: [{ from: 1.5, to: 2.5, color: PALETTE.green, text: "leggyorsabb" }], done: "Másfél és két és fél óra között: 1 óra alatt 20 km-t tett meg. Minél meredekebb a grafikon, annál gyorsabb a haladás.", hint: "Melyik szakaszon nő a távolság a legnagyobbat ugyanannyi idő alatt?" },
      { prompt: "Mikor volt a legtávolabb az otthonától? Kattints a legmagasabb pontra!", hit: (t) => Math.abs(t - 2.5) < 0.3, marks: [{ point: 2.5 }], done: "Két és fél óra elteltével, 35 km-re. Ez a maximum.", hint: "A legtávolabbi hely a grafikon legmagasabb pontja." },
      { prompt: "Mikor közeledett az otthona felé? Kattints arra a szakaszra, ahol csökken a távolság!", hit: (t) => t > 2.6 && t < 4.4, marks: [{ from: 2.5, to: 4.5, color: PALETTE.red, text: "hazafelé" }], done: "Két és fél és négy és fél óra között: a távolság csökkent, vagyis hazafelé tartott. Ez a csökkenő szakasz.", hint: "Hazafelé menet egyre kisebb a távolság az otthontól." },
    ],
  },
};

export function mount(root) {
  const scope = createScope();
  const state = { graph: "temperature", question: 0, solved: [], hover: null };
  const graph = () => GRAPHS[state.graph];

  root.append(lead("Egy grafikon történetet mesél: megmutatja, hogyan változik valami az idő múlásával. Ha jól nézed, leolvasható róla, mikor volt a legtöbb, mikor a legkevesebb, és mikor nőtt vagy csökkent az érték."));

  const main = card("Olvass a grafikonból");
  const tabs = make("div", "il-controls");
  const question = make("p");
  question.style.fontWeight = "600";
  const readout = make("p", "il-muted");
  readout.style.minHeight = "1.4em";
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", style: "touch-action:none;cursor:crosshair" });
  const message = make("p", "il-message");
  const next = button("Következő kérdés", nextQuestion);
  main.append(tabs, question, readout, figure, message, controls(next, button("Újrakezdem", () => switchGraph(state.graph), { ghost: true })));
  root.append(main, keyIdea("a grafikon magas pontja nagy értéket jelent, az alacsony kicsit. Ahol jobbra haladva felfelé megy, ott az érték nő; ahol lefelé, ott csökken; ahol vízszintes, ott nem változik."));

  const sx = (t) => LEFT + (t / graph().xMax) * (W - LEFT - RIGHT);
  const sy = (v) => H - BOTTOM - ((v - graph().yMin) / (graph().yMax - graph().yMin)) * (H - TOP - BOTTOM);
  const timeAt = (event) => {
    const box = figure.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    return Math.max(0, Math.min(graph().xMax, ((px - LEFT) / (W - LEFT - RIGHT)) * graph().xMax));
  };
  const setMessage = (text, tone = "") => { message.textContent = text; message.className = `il-message ${tone}`; };

  function switchGraph(key) {
    state.graph = key; state.question = 0; state.solved = []; state.hover = null;
    tabs.replaceChildren(...Object.entries(GRAPHS).map(([name, g]) => toggle(g.label, name === key, () => switchGraph(name))));
    setMessage("");
    render();
  }

  function nextQuestion() {
    state.question = (state.question + 1) % graph().questions.length;
    if (state.question === 0) state.solved = [];
    setMessage("");
    render();
  }

  function render() {
    const g = graph(), q = g.questions[state.question], solved = state.solved.includes(state.question);
    question.textContent = `${state.question + 1}. kérdés: ${q.prompt}`;
    next.disabled = !solved;
    next.textContent = state.question === g.questions.length - 1 ? "Kezdjük elölről" : "Következő kérdés";
    readout.textContent = state.hover === null ? "Mozgasd az egeret a grafikon fölött, és leolvashatod az értékeket." : g.readout(state.hover, g.f(state.hover));
    figure.replaceChildren();
    for (let t = 0; t <= g.xMax; t += g.xStep) {
      svg("line", { x1: sx(t), x2: sx(t), y1: TOP, y2: H - BOTTOM, class: "grid" }, figure);
      svg("text", { x: sx(t), y: H - BOTTOM + 16, "text-anchor": "middle", text: formatNumber(t), style: "font-size:11px;fill:var(--dim)" }, figure);
    }
    for (let v = g.yMin; v <= g.yMax; v += g.yStep) {
      svg("line", { x1: LEFT, x2: W - RIGHT, y1: sy(v), y2: sy(v), class: "grid" }, figure);
      svg("text", { x: LEFT - 6, y: sy(v) + 4, "text-anchor": "end", text: formatNumber(v), style: "font-size:11px;fill:var(--dim)" }, figure);
    }
    svg("line", { x1: LEFT, x2: W - RIGHT, y1: H - BOTTOM, y2: H - BOTTOM, class: "axis" }, figure);
    svg("line", { x1: LEFT, x2: LEFT, y1: TOP, y2: H - BOTTOM, class: "axis" }, figure);
    svg("text", { x: W - RIGHT, y: H - 6, "text-anchor": "end", text: g.xName, style: "font-style:italic" }, figure);
    svg("text", { x: LEFT + 6, y: TOP + 10, text: g.yName, style: "font-style:italic" }, figure);

    if (solved) for (const mark of q.marks) {
      if (mark.point !== undefined) continue;
      svg("rect", { x: sx(mark.from), y: TOP, width: sx(mark.to) - sx(mark.from), height: H - TOP - BOTTOM, style: `fill:${mark.color};opacity:.2` }, figure);
      svg("text", { x: (sx(mark.from) + sx(mark.to)) / 2, y: TOP + 18, "text-anchor": "middle", text: mark.text, style: `fill:${mark.color};font-weight:700` }, figure);
    }
    const d = g.samples.map((t, i) => `${i ? "L" : "M"} ${sx(t)} ${sy(g.f(t))}`).join(" ");
    svg("path", { d, fill: "none", style: "stroke:var(--accent);stroke-width:3.5;stroke-linejoin:round" }, figure);
    if (solved) for (const mark of q.marks) {
      if (mark.point === undefined) continue;
      svg("circle", { cx: sx(mark.point), cy: sy(g.f(mark.point)), r: 11, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, figure);
      svg("line", { x1: sx(mark.point), x2: sx(mark.point), y1: sy(g.f(mark.point)), y2: H - BOTTOM, style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:5 4` }, figure);
      svg("line", { x1: sx(mark.point), x2: LEFT, y1: sy(g.f(mark.point)), y2: sy(g.f(mark.point)), style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:5 4` }, figure);
    }
    if (state.hover !== null) {
      const t = state.hover, v = g.f(t);
      svg("line", { x1: sx(t), x2: sx(t), y1: sy(v), y2: H - BOTTOM, style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, figure);
      svg("line", { x1: sx(t), x2: LEFT, y1: sy(v), y2: sy(v), style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, figure);
      svg("circle", { cx: sx(t), cy: sy(v), r: 6, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, figure);
    }
  }

  figure.addEventListener("pointermove", (event) => { state.hover = timeAt(event); render(); });
  figure.addEventListener("pointerleave", () => { state.hover = null; render(); });
  figure.addEventListener("click", (event) => {
    const q = graph().questions[state.question];
    if (state.solved.includes(state.question)) return;
    if (q.hit(timeAt(event))) {
      state.solved.push(state.question);
      setMessage(q.done, "good");
    } else setMessage(`Ez még nem az. ${q.hint}`, "warn");
    render();
  });

  switchGraph("temperature");
  return () => scope.clearAll();
}
