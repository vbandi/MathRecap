import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg } from "./kit.js";

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((c) => (c === "-" ? "⁻" : SUPERSCRIPTS[Number(c)])).join("");
const AXIS_MIN = -11, AXIS_MAX = 12, AXIS_X = 30, AXIS_WIDTH = 540, AXIS_Y = 120;
// Lengths in metres: name, mantissa, exponent.
const REFERENCES = [["atom", 1, -10], ["baktérium", 2, -6], ["hajszál vastagsága", 7, -5], ["ember", 1.7, 0], ["Föld átmérője", 1.27, 7], ["Föld–Nap távolság", 1.5, 11]];
const QUIZ = [["45 · 10⁻⁶", false], ["4,5 · 10⁻⁵", true], ["0,7 · 10³", false], ["6,02 · 10²³", true], ["10 · 10⁵", false], ["9,99 · 10⁻¹", true], ["12,5 · 10⁴", false], ["1 · 10⁸", true]];

const toAxisX = (exponent) => AXIS_X + ((exponent - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * AXIS_WIDTH;

// Decimal writing of digits·10^(exponent - digits.length + 1) with the comma placed by position.
function decimalText(digits, exponent) {
  const position = 1 + exponent;
  if (position <= 0) return `0,${"0".repeat(-position)}${digits}`;
  if (position >= digits.length) return digits + "0".repeat(position - digits.length);
  return `${digits.slice(0, position)},${digits.slice(position)}`;
}

// Converts a decimal string to normal form without floating point: returns { digits, exponent } or null.
function toNormalForm(text) {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const [integer, fractional = ""] = clean.split(".");
  const all = integer + fractional;
  const first = all.search(/[1-9]/);
  if (first < 0) return { zero: true };
  return { digits: all.slice(first).replace(/0+$/, ""), exponent: integer.length - first - 1, shift: integer.length - first - 1 };
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A nagyon nagy és nagyon kicsi számokat (egy atom mérete, a Nap távolsága) nehéz nullákkal leírni. A normálalak ezt rövidíti: egy 1 és 10 közötti szám szorozva 10 egész kitevős hatványával, például 3,2 · 10⁵."));

  const state = { mantissa: 3.2, exponent: 0 };
  const main = card("A 10 hatványa tologatja a tizedesvesszőt");
  const mantissaSlider = range({ label: "Szám (a)", min: 1, max: 9.9, step: 0.1, value: state.mantissa, onInput: (v) => { state.mantissa = v; render(); } });
  const exponentSlider = range({ label: "Kitevő (n)", min: -8, max: 8, value: 0, format: (v) => String(v).replace("-", "−"), onInput: (v) => { state.exponent = v; render(); } });
  const normalLine = make("div", "il-formula start");
  normalLine.style.fontSize = "22px";
  const decimalLine = make("div", "il-formula start");
  decimalLine.style.cssText += "font-size:26px;min-height:1.6em;overflow-wrap:anywhere;";
  const hopMessage = make("p", "il-message");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 200", role: "img" }, main);
  const axisLayer = svg("g", {}, figure);
  svg("line", { x1: AXIS_X, x2: AXIS_X + AXIS_WIDTH, y1: AXIS_Y, y2: AXIS_Y, class: "axis" }, axisLayer);
  for (let e = AXIS_MIN; e <= AXIS_MAX; e++) {
    svg("line", { x1: toAxisX(e), x2: toAxisX(e), y1: AXIS_Y - 5, y2: AXIS_Y + 5, class: "axis" }, axisLayer);
    if (e % 3 === 0) svg("text", { x: toAxisX(e), y: AXIS_Y + 22, "text-anchor": "middle", text: `10${sup(e)} m`, style: "font-size:11px;fill:var(--dim)" }, axisLayer);
  }
  REFERENCES.forEach(([name, mantissa, exponent], index) => {
    const x = toAxisX(Math.log10(mantissa) + exponent);
    const up = index % 2 === 0;
    svg("circle", { cx: x, cy: AXIS_Y, r: 5, style: `fill:${PALETTE.amber}` }, axisLayer);
    svg("line", { x1: x, x2: x, y1: AXIS_Y, y2: up ? AXIS_Y - 28 : AXIS_Y + 40, style: `stroke:${PALETTE.amber};stroke-width:1` }, axisLayer);
    svg("text", { x, y: up ? AXIS_Y - 34 : AXIS_Y + 54, "text-anchor": index === 0 ? "start" : index === REFERENCES.length - 1 ? "end" : "middle", text: name, style: `fill:${PALETTE.amber};font-size:12px` }, axisLayer);
  });
  const marker = svg("g", { class: "il-move" }, figure);
  svg("circle", { r: 8, cy: AXIS_Y, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2` }, marker);
  svg("text", { y: 24, "text-anchor": "middle", text: "a · 10ⁿ m", style: `fill:${PALETTE.red};font-weight:700` }, marker);
  main.append(controls(mantissaSlider.element, exponentSlider.element), normalLine, decimalLine, figure, hopMessage);

  // --- Converter ---
  const converter = card("Átalakító: szám → normálalak");
  const input = make("input");
  input.type = "text"; input.value = "0,000045"; input.setAttribute("aria-label", "Szám");
  input.style.cssText = "padding:6px 10px;border:1px solid var(--line-strong);border-radius:9px;background:var(--input);color:var(--fg);font:16px var(--font-mono);width:16ch;";
  const examples = ["0,000045", "123000000", "7", "0,5", "602000000000000000000000"].map((text) => button(text.length > 10 ? "nagy szám" : text, () => { input.value = text; convert(); }, { ghost: true }));
  const stepsLine = make("div", "il-formula start");
  const checkLine = make("p", "il-message");
  input.addEventListener("input", convert);
  converter.append(controls(make("span", "il-muted", "Írj be egy pozitív számot:"), input), controls(...examples), stepsLine, checkLine);

  // --- Quiz ---
  const quiz = card("Kihívás: normálalak-e?");
  let quizIndex = 0;
  const quizText = make("div", "il-formula");
  quizText.style.fontSize = "24px";
  const quizMessage = make("p", "il-message");
  const answer = (guess) => {
    const correct = QUIZ[quizIndex][1];
    quizMessage.className = guess === correct ? "il-message good" : "il-message warn";
    quizMessage.textContent = `${guess === correct ? "Helyes! " : "Nem egészen. "}${correct ? "Az első tényező 1 és 10 közé esik (1 ≤ a < 10), ezért ez normálalak." : "Az első tényező nem esik 1 és 10 közé (1 ≤ a < 10 kell), ezért nem normálalak. Told át a vesszőt, és változtasd a kitevőt is!"}`;
  };
  quiz.append(quizText, controls(button("Igen, normálalak", () => answer(true)), button("Nem az", () => answer(false), { ghost: true }), button("Másik szám", () => { quizIndex = (quizIndex + 1) % QUIZ.length; renderQuiz(); }, { ghost: true })), quizMessage);
  root.append(main, converter, quiz, keyIdea("a normálalak a · 10ⁿ, ahol 1 ≤ a < 10 és n egész. Pozitív kitevőnél a vesszőt n hellyel jobbra, negatív kitevőnél |n| hellyel balra toljuk."));

  function render() {
    const { mantissa, exponent } = state;
    mantissaSlider.set(mantissa); exponentSlider.set(exponent);
    const digits = String(Math.round(mantissa * 10)).replace(/0+$/, "");
    normalLine.textContent = `${formatNumber(mantissa, 1)} · 10${sup(exponent)}`;
    decimalLine.textContent = `= ${decimalText(digits, exponent)}`;
    hopMessage.textContent = exponent === 0 ? "A kitevő 0: a vessző nem mozdul (10⁰ = 1)."
      : `${Math.abs(exponent)} hellyel ${exponent > 0 ? "jobbra" : "balra"} kell tolni a vesszőt. ${exponent > 0 ? "A szám nagyobb lesz." : "A szám kisebb lesz."}`;
    const position = Math.log10(mantissa) + exponent;
    marker.style.transform = `translate(${toAxisX(position)}px, 0px)`;
    const nearest = REFERENCES.reduce((best, item) => (Math.abs(Math.log10(item[1]) + item[2] - position) < Math.abs(Math.log10(best[1]) + best[2] - position) ? item : best));
    hopMessage.textContent += ` Hosszként (méterben) ez nagyságrendileg olyan, mint: ${nearest[0]}.`;
  }

  function convert() {
    const result = toNormalForm(input.value);
    checkLine.className = "il-message";
    if (!result) { stepsLine.textContent = ""; checkLine.textContent = "Írj be egy pozitív számot (tizedesvesszővel vagy anélkül)."; return; }
    if (result.zero) { stepsLine.textContent = "0"; checkLine.textContent = "A 0 nem írható fel a · 10ⁿ alakban, mert a nem lehet nulla."; return; }
    const mantissaText = result.digits.length > 1 ? `${result.digits[0]},${result.digits.slice(1)}` : result.digits;
    stepsLine.textContent = `${input.value.trim()} = ${mantissaText} · 10${sup(result.exponent)}`;
    checkLine.className = "il-message good";
    checkLine.textContent = `A vesszőt ${result.shift === 0 ? "nem kell mozdítani" : `${Math.abs(result.shift)} hellyel ${result.shift > 0 ? "balra" : "jobbra"} toltuk`}, hogy az első tényező ${mantissaText} legyen. Ellenőrzés: 1 ≤ ${mantissaText} < 10 teljesül, így ez normálalak; a kitevő ${String(result.exponent).replace("-", "−")}${result.shift > 0 ? ": ennyit toltunk balra, ezért pozitív" : result.shift < 0 ? ": jobbra toltunk, ezért negatív" : ""}.`;
  }

  function renderQuiz() {
    quizText.textContent = QUIZ[quizIndex][0];
    quizMessage.className = "il-message"; quizMessage.textContent = "";
  }

  render();
  convert();
  renderQuiz();
  return () => scope.clearAll();
}
