import { button, card, controls, createScope, keyIdea, lead, make, svg, toggle, uniqueId } from "./kit.js";

const TASKS = {
  fruit: {
    label: "Kedvenc gyümölcs",
    prompt: "Anna az almát szereti, Bence a körtét, Csilla szintén az almát, Dani pedig a szilvát. Kösd össze mindenkit a kedvenc gyümölcsével!",
    left: ["Anna", "Bence", "Csilla", "Dani"],
    right: ["alma", "körte", "szilva", "dinnye"],
    answer: [0, 1, 0, 2],
    done: "Jól van! Két nyíl is az almához fut, a dinnyéhez pedig egy sem — ez belefér. Az a fontos, hogy minden gyerekből pontosan egy nyíl indul.",
  },
  double: {
    label: "Számok kétszerese",
    prompt: "A szabály: minden számhoz tartozik a kétszerese. Húzz nyilat minden számtól a kétszereséhez!",
    left: [1, 2, 3, 4],
    right: [2, 4, 5, 6, 8, 10],
    answer: [0, 1, 3, 4],
    done: "Jól van! Minden számból pontosan egy nyíl indul, és a nyilak a kétszeresekhez vezetnek. Az 5 és a 10 kimaradt, de ez nem baj.",
  },
};

const RULES = [
  { label: "x + 3", apply: (x) => x + 3 },
  { label: "2 · x", apply: (x) => 2 * x },
  { label: "x · x", apply: (x) => x * x },
  { label: "10 − x", apply: (x) => 10 - x },
];
const INPUTS = [1, 2, 3, 4];

const VIEW_W = 600, VIEW_H = 290, LEFT_X = 70, RIGHT_X = 430, BOX_W = 100, BOX_H = 34;

// Draws the two columns of an arrow diagram and returns the groups to fill with items and arrows.
function columnY(index, count) {
  return count === 1 ? VIEW_H / 2 : 30 + (index * (VIEW_H - 60)) / (count - 1);
}

function diagramFrame(parent) {
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, role: "img" }, parent);
  const markerId = uniqueId("arrow-head");
  const defs = svg("defs", {}, figure);
  for (const [name, color] of [["", "var(--accent)"], ["-bad", "var(--warn)"], ["-good", "var(--il-green)"]]) {
    const marker = svg("marker", { id: markerId + name, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto" }, defs);
    svg("path", { d: "M 0 0 L 10 5 L 0 10 Z", style: `fill:${color}` }, marker);
  }
  svg("ellipse", { cx: LEFT_X + BOX_W / 2, cy: VIEW_H / 2, rx: 78, ry: 125, fill: "none", style: "stroke:var(--line-strong);stroke-width:1.5" }, figure);
  svg("ellipse", { cx: RIGHT_X + BOX_W / 2, cy: VIEW_H / 2, rx: 78, ry: 125, fill: "none", style: "stroke:var(--line-strong);stroke-width:1.5" }, figure);
  svg("text", { x: LEFT_X + BOX_W / 2, y: 14, "text-anchor": "middle", text: "Kiindulás", style: "fill:var(--dim)" }, figure);
  svg("text", { x: RIGHT_X + BOX_W / 2, y: 14, "text-anchor": "middle", text: "Hozzárendelt", style: "fill:var(--dim)" }, figure);
  return { figure, markerId, arrows: svg("g", {}, figure), items: svg("g", {}, figure) };
}

function drawBox(parent, x, y, text, { selected = false, interactive = false, onClick } = {}) {
  const group = svg("g", { class: interactive ? "il-item" : "" }, parent);
  svg("rect", { x, y: y - BOX_H / 2, width: BOX_W, height: BOX_H, rx: 10, style: `fill:var(--surface);stroke:${selected ? "var(--accent)" : "var(--line-strong)"};stroke-width:${selected ? 3 : 1.5}` }, group);
  svg("text", { x: x + BOX_W / 2, y: y + 5, "text-anchor": "middle", text: String(text), style: "fill:var(--fg);font-weight:600;font-size:15px" }, group);
  if (interactive) {
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", 0);
    group.addEventListener("click", onClick);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } });
  }
  return group;
}

function drawArrow(parent, markerId, fromIndex, fromCount, toIndex, toCount, status = "") {
  const color = status === "bad" ? "var(--warn)" : status === "good" ? "var(--il-green)" : "var(--accent)";
  svg("line", {
    x1: LEFT_X + BOX_W + 2, y1: columnY(fromIndex, fromCount), x2: RIGHT_X - 3, y2: columnY(toIndex, toCount),
    "marker-end": `url(#${markerId}${status ? `-${status}` : ""})`, style: `stroke:${color};stroke-width:2.5`,
  }, parent);
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A hozzárendelés azt mondja meg, hogy az egyik halmaz minden eleméhez melyik elem tartozik a másik halmazból. Nyilakkal rajzoljuk le: a nyíl a kiindulási elemtől a hozzárendelt elem felé mutat."));

  // ---- Card 1: draw the arrows ----
  const draw = card("Rajzold meg a nyilakat");
  const state = { task: "fruit", arrows: [], selected: null, checked: false };
  const tabs = make("div", "il-controls");
  const prompt = make("p");
  const message = make("p", "il-message");
  const frame = diagramFrame(draw);
  const checkButton = button("Ellenőrzés", check);
  const clearButton = button("Törlés", () => { state.arrows = []; state.selected = null; state.checked = false; setMessage(""); render(); }, { ghost: true });
  draw.insertBefore(tabs, frame.figure);
  tabs.append(...Object.entries(TASKS).map(([key, task]) => toggle(task.label, key === state.task, () => switchTask(key))));
  draw.insertBefore(prompt, frame.figure);
  draw.append(make("p", "il-muted", "Kattints egy kiindulási elemre, majd arra az elemre, amelyikhez rendeled. Egy kész nyílra kattintva törölheted."), controls(checkButton, clearButton), message);

  const setMessage = (text, tone = "") => { message.textContent = text; message.className = `il-message ${tone}`; };

  function switchTask(key) {
    state.task = key; state.arrows = []; state.selected = null; state.checked = false;
    tabs.replaceChildren(...Object.entries(TASKS).map(([name, task]) => toggle(task.label, name === key, () => switchTask(name))));
    setMessage("");
    render();
  }

  function statusOf([from, to]) {
    if (!state.checked) return "";
    const task = TASKS[state.task];
    const count = state.arrows.filter(([f]) => f === from).length;
    return count === 1 && task.answer[from] === to ? "good" : "bad";
  }

  function render() {
    const task = TASKS[state.task];
    prompt.textContent = task.prompt;
    frame.arrows.replaceChildren();
    frame.items.replaceChildren();
    task.left.forEach((text, index) => drawBox(frame.items, LEFT_X, columnY(index, task.left.length), text, {
      selected: state.selected === index, interactive: true,
      onClick: () => { state.selected = state.selected === index ? null : index; render(); },
    }));
    task.right.forEach((text, index) => drawBox(frame.items, RIGHT_X, columnY(index, task.right.length), text, {
      interactive: true,
      onClick: () => {
        if (state.selected === null) return setMessage("Előbb kattints egy elemre a bal oldalon.", "warn");
        const existing = state.arrows.findIndex(([f, t]) => f === state.selected && t === index);
        if (existing >= 0) state.arrows.splice(existing, 1);
        else state.arrows.push([state.selected, index]);
        state.selected = null; state.checked = false; setMessage(""); render();
      },
    }));
    for (const arrow of state.arrows) {
      drawArrow(frame.arrows, frame.markerId, arrow[0], task.left.length, arrow[1], task.right.length, statusOf(arrow));
      // A wide invisible line on top makes thin arrows easy to click and remove.
      const hit = svg("line", {
        x1: LEFT_X + BOX_W, y1: columnY(arrow[0], task.left.length), x2: RIGHT_X, y2: columnY(arrow[1], task.right.length),
        style: "stroke:transparent;stroke-width:14;cursor:pointer",
      }, frame.arrows);
      hit.addEventListener("click", () => { state.arrows = state.arrows.filter((a) => a !== arrow); state.checked = false; setMessage(""); render(); });
    }
  }

  function check() {
    const task = TASKS[state.task];
    const missing = task.left.filter((_, i) => !state.arrows.some(([f]) => f === i));
    const doubled = task.left.filter((_, i) => state.arrows.filter(([f]) => f === i).length > 1);
    const wrong = state.arrows.filter(([f, t]) => task.answer[f] !== t);
    state.checked = true;
    if (missing.length) setMessage(`Még nem indul nyíl innen: ${missing.join(", ")}. Mindenkinek kell hozzárendelt elem.`, "warn");
    else if (doubled.length) setMessage(`Innen több nyíl is indul: ${doubled.join(", ")}. Egy elemhez csak egy hozzárendelt elem tartozhat.`, "warn");
    else if (wrong.length) setMessage("Minden elemből egy nyíl indul, de néhány rossz helyre mutat (pirossal jelöltük). Olvasd el újra a feladatot!", "warn");
    else setMessage(task.done, "good");
    render();
  }

  // ---- Card 2: guess the rule ----
  const guess = card("Melyik szabály tartozik a nyilakhoz?");
  const guessState = { rule: 0, picked: null };
  const guessFrame = diagramFrame(guess);
  const guessMessage = make("p", "il-message");
  const optionRow = make("div", "il-controls");
  guess.insertBefore(make("p", "", "A nyilak egy szabály szerint készültek. Találd ki, mi a szabály!"), guessFrame.figure);
  guess.append(optionRow, guessMessage, controls(button("Új feladat", nextRule, { ghost: true })));

  function renderGuess() {
    const rule = RULES[guessState.rule];
    const outputs = [...new Set(INPUTS.map(rule.apply))].sort((a, b) => a - b);
    guessFrame.arrows.replaceChildren();
    guessFrame.items.replaceChildren();
    INPUTS.forEach((x, i) => drawBox(guessFrame.items, LEFT_X, columnY(i, INPUTS.length), x));
    outputs.forEach((y, i) => drawBox(guessFrame.items, RIGHT_X, columnY(i, outputs.length), y));
    INPUTS.forEach((x, i) => drawArrow(guessFrame.arrows, guessFrame.markerId, i, INPUTS.length, outputs.indexOf(rule.apply(x)), outputs.length));
    optionRow.replaceChildren(...RULES.map((option, index) => toggle(`x ↦ ${option.label}`, guessState.picked === index, () => pick(index))));
  }

  function pick(index) {
    const rule = RULES[guessState.rule];
    guessState.picked = index;
    const option = RULES[index];
    if (index === guessState.rule) {
      guessMessage.className = "il-message good";
      guessMessage.textContent = `Így van: a szabály x ↦ ${rule.label}. Az 1-hez ${rule.apply(1)} tartozik, a 2-höz ${rule.apply(2)}, a 3-hoz ${rule.apply(3)}, a 4-hez ${rule.apply(4)}.`;
    } else {
      const shown = rule.apply(INPUTS[0]);
      guessMessage.className = "il-message warn";
      guessMessage.textContent = `Nem ez. Ezzel a szabállyal (${option.label}) az 1-hez ${option.apply(1)} tartozna, de az ábrán az 1-hez ${shown} tartozik. Próbáld újra!`;
    }
    renderGuess();
  }

  function nextRule() {
    guessState.rule = (guessState.rule + 1 + Math.floor(Math.random() * (RULES.length - 1))) % RULES.length;
    guessState.picked = null;
    guessMessage.textContent = ""; guessMessage.className = "il-message";
    renderGuess();
  }

  root.append(draw, guess, keyIdea("a hozzárendelés minden kiindulási elemhez megmondja, melyik elem tartozik hozzá. Ha a nyilakból ki tudod találni a szabályt, akkor bármelyik új elemre meg tudod mondani, hová mutatna a nyíl."));
  render();
  renderGuess();
  return () => scope.clearAll();
}
