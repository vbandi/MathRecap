import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const NBSP = " ";
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const UNITS = [{ value: 10, name: "tízesre" }, { value: 100, name: "százasra" }, { value: 1000, name: "ezresre" }];
const ORDINAL_DIGIT = { 10: "egyesek", 100: "tízesek", 1000: "százasok" };
const LEFT = 50, RIGHT = 550;
const roundFirstDigit = (n) => { const unit = 10 ** (String(n).length - 1); return Math.round(n / unit) * unit; };
const shuffle = (list) => list.map((value) => [Math.random(), value]).sort((x, y) => x[0] - y[0]).map(([, value]) => value);

export function mount(root) {
  const scope = createScope();
  root.append(lead("Sokszor nem kell pontos érték: elég, ha tudjuk, nagyjából mekkora egy szám. Ilyenkor kerekítünk a legközelebbi kerek számra, és a kerek számokkal fejben gyorsan tudunk dolgozni."));

  // --- Rounding on a number line ---
  const rounding = card("Kerekítés a számegyenesen");
  const state = { n: 4637, unit: 100 };
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" });
  const message = make("p", "il-message");
  const unitButtons = UNITS.map(({ value, name }) => toggle(name, value === state.unit, () => { state.unit = value; renderRounding(); }));
  const slider = range({ label: "Szám", min: 0, max: 9999, value: state.n, format: grouped, onInput: (value) => { state.n = value; renderRounding(); } });
  rounding.append(controls(slider.element), controls(make("span", "il-muted", "Kerekítés:"), ...unitButtons), figure, message);
  function renderRounding() {
    const { n, unit } = state, low = Math.floor(n / unit) * unit, high = low + unit, middle = low + unit / 2;
    const roundUp = n - low >= unit / 2, result = roundUp ? high : low, x = (value) => LEFT + ((value - low) / unit) * (RIGHT - LEFT);
    unitButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(UNITS[index].value === unit)));
    figure.replaceChildren();
    svg("line", { x1: LEFT - 20, x2: RIGHT + 20, y1: 100, y2: 100, class: "axis" }, figure);
    const text = (px, py, content, color = "var(--fg-soft)", size = 14, weight = 500) => svg("text", { x: px, y: py, "text-anchor": "middle", text: content, style: `fill:${color};font-size:${size}px;font-weight:${weight}` }, figure);
    for (const [value, color] of [[low, !roundUp ? PALETTE.green : "var(--fg-soft)"], [high, roundUp ? PALETTE.green : "var(--fg-soft)"]]) {
      svg("line", { x1: x(value), x2: x(value), y1: 88, y2: 112, style: `stroke:${color};stroke-width:3` }, figure);
      text(x(value), 134, grouped(value), color, 17, 700);
    }
    svg("line", { x1: x(middle), x2: x(middle), y1: 40, y2: 112, style: "stroke:var(--dim);stroke-dasharray:5 4" }, figure);
    text(x(middle), 152, `fél út: ${grouped(middle)}`, "var(--dim)", 12);
    svg("path", { d: `M ${x(n)} 98 l -9 -20 h 18 Z`, style: `fill:${PALETTE.red}` }, figure);
    text(x(n), 66, grouped(n), PALETTE.red, 16, 700);
    const target = roundUp ? high : low;
    svg("line", { x1: x(n), x2: x(target), y1: 92, y2: 92, style: `stroke:${PALETTE.green};stroke-width:4;opacity:.8` }, figure);
    text(x(middle), 22, unit === 10 ? "A nyíl a közelebbi kerek szám felé mutat" : "A zöld szakasz a közelebbi kerek számig ér", "var(--dim)", 12);
    const digit = Math.floor((n % unit) / (unit / 10));
    message.className = "il-message good";
    message.textContent = n === low
      ? `${grouped(n)} már kerek ${UNITS.find((entry) => entry.value === unit).name}, nincs mit kerekíteni.`
      : `${grouped(n)} ${UNITS.find((entry) => entry.value === unit).name} kerekítve: ${grouped(result)}. Döntő jegy (${ORDINAL_DIGIT[unit]} helyén): ${digit}. ${digit >= 5 ? "Ez 5 vagy több, ezért felfelé kerekítünk" : "Ez 5-nél kisebb, ezért lefelé kerekítünk"}.`;
  }

  // --- Estimation game ---
  const game = card("Kihívás: melyik a legjobb becslés?");
  let question, answered;
  const prompt = make("div", "il-formula start");
  prompt.style.fontSize = "26px";
  const options = make("div", "il-controls");
  const gameMessage = make("p", "il-message");
  game.append(make("p", "il-muted", "Ne számolj pontosan! Kerekítsd mindkét számot az első számjegyére, és úgy szorozz."), prompt, options, gameMessage, controls(button("Új feladat", newQuestion, { ghost: true })));
  function newQuestion() {
    const a = randomInt(120, 989), b = randomInt(12, 98), good = roundFirstDigit(a) * roundFirstDigit(b);
    const exact = a * b;
    const distractors = [good * 10, Math.max(10, good / 10), Math.round((exact * 1.45) / 100) * 100];
    const values = [...new Set([good, ...distractors])].filter((value) => value > 0);
    while (values.length < 4) values.push(good + 100 * (values.length + 1));
    question = { a, b, good, exact, choices: shuffle(values) };
    answered = false;
    prompt.textContent = `${a} · ${b} ≈ ?`;
    gameMessage.className = "il-message"; gameMessage.textContent = "";
    options.replaceChildren(...question.choices.map((value) => {
      const option = toggle(grouped(value), false, () => choose(value, option));
      option.style.fontSize = "17px";
      return option;
    }));
  }
  function choose(value, option) {
    if (answered) return;
    answered = true;
    const right = value === question.good, error = Math.abs(question.exact - value);
    option.setAttribute("aria-pressed", "true");
    option.style.setProperty("--c", right ? PALETTE.green : PALETTE.red);
    const { a, b, exact, good } = question;
    gameMessage.className = `il-message ${right ? "good" : "warn"}`;
    gameMessage.textContent = `${right ? "Jó becslés! " : `Nem ez az: ${grouped(good)} lenne a jó. `}${a} · ${b} ≈ ${roundFirstDigit(a)} · ${roundFirstDigit(b)} = ${grouped(good)}. A pontos eredmény ${grouped(exact)}, a tipped eltérése: ${grouped(error)}.`;
  }

  root.append(rounding, game, keyIdea("kerekítéskor a legközelebbi kerek számot keressük: ha a következő jegy 0–4, lefelé, ha 5–9, felfelé kerekítünk. A kerekített számokkal végzett becslés megmutatja a nagyságrendet, így kiszűri a durva hibákat."));
  renderRounding();
  newQuestion();
  return () => scope.clearAll();
}
