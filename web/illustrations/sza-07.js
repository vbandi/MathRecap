import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, toggle } from "./kit.js";

const SYMBOLS = [["I", 1], ["V", 5], ["X", 10], ["L", 50], ["C", 100], ["D", 500], ["M", 1000]];
const VALUE = Object.fromEntries(SYMBOLS);
const SUBTRACTIVE = new Set(["IV", "IX", "XL", "XC", "CD", "CM"]);
const PATTERNS = [["", "M", "MM", "MMM"], ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"], ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"], ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]];
const PLACE_VALUES = [1000, 100, 10, 1];
const VALID_ROMAN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const LEVELS = [{ name: "1–99", max: 99 }, { name: "1–999", max: 999 }, { name: "1–3999", max: 3999 }];
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// One entry per non-zero digit: the Roman piece, its value and whether it is a subtractive pair.
function pieces(n) {
  const digits = String(n).padStart(4, "0").split("").map(Number);
  return digits.flatMap((digit, index) => (digit ? [{ roman: PATTERNS[index][digit], value: digit * PLACE_VALUES[index] }] : []));
}
const toRoman = (n) => pieces(n).map((piece) => piece.roman).join("");
function fromRoman(text) {
  if (!text || !VALID_ROMAN.test(text)) return null;
  let total = 0;
  [...text].forEach((ch, i) => { total += VALUE[ch] < (VALUE[text[i + 1]] ?? 0) ? -VALUE[ch] : VALUE[ch]; });
  return total;
}

function styleInput(input, width) {
  input.style.cssText = `width:${width}ch;padding:7px 10px;border:1px solid var(--line-strong);border-radius:10px;background:var(--input);color:var(--fg);font:18px var(--font-mono)`;
}

function pieceTiles(n) {
  const row = make("div", "il-controls");
  row.style.alignItems = "flex-start";
  for (const piece of pieces(n)) {
    const color = SUBTRACTIVE.has(piece.roman) ? PALETTE.amber : PALETTE.blue;
    const tile = make("div");
    tile.style.cssText = `min-width:64px;padding:8px 12px;border:2px solid ${color};border-radius:12px;background:var(--input);text-align:center`;
    const symbol = make("div", "", piece.roman);
    symbol.style.cssText = `font:700 24px var(--font-mono);color:${color}`;
    const value = make("div", "il-muted", String(piece.value));
    tile.append(symbol, value);
    row.append(tile);
  }
  return row;
}

// Each letter with its own value: negative when a bigger symbol follows it.
function letterValues(text) {
  const row = make("div", "il-controls");
  row.style.gap = "6px";
  [...text].forEach((ch, i) => {
    const negative = VALUE[ch] < (VALUE[text[i + 1]] ?? 0);
    const color = negative ? PALETTE.amber : PALETTE.blue;
    const cell = make("div");
    cell.style.cssText = `width:54px;padding:6px 0;border-radius:10px;border:1px solid ${color};text-align:center;background:var(--input)`;
    const letter = make("div", "", ch);
    letter.style.cssText = `font:700 22px var(--font-mono);color:${color}`;
    cell.append(letter, make("div", "il-muted", `${negative ? "−" : "+"}${VALUE[ch]}`));
    row.append(cell);
  });
  return row;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A római számok betűkből állnak, és minden betű egy meghatározott számot jelent. A számot a betűk értékeinek összege adja, de ha egy kisebb betű áll a nagyobb előtt, akkor azt ki kell vonni."));

  // --- Converter ---
  const converter = card("Átváltás oda-vissza");
  let number = 1994;
  const numberInput = make("input"), romanInput = make("input");
  Object.assign(numberInput, { type: "number", min: 1, max: 3999, value: number });
  Object.assign(romanInput, { type: "text", value: toRoman(number), maxLength: 15 });
  numberInput.setAttribute("aria-label", "Szám");
  romanInput.setAttribute("aria-label", "Római szám");
  styleInput(numberInput, 9); styleInput(romanInput, 16);
  const stepButtons = [["−10", -10], ["−1", -1], ["+1", 1], ["+10", 10]].map(([label, delta]) => button(label, () => setNumber(number + delta), { ghost: true }));
  const legend = make("div", "il-controls");
  for (const [symbol, value] of SYMBOLS) {
    const chip = make("span", "il-muted", `${symbol} = ${value}`);
    chip.style.cssText = "padding:2px 9px;border:1px solid var(--line);border-radius:999px";
    legend.append(chip);
  }
  const breakdown = make("div"), sum = make("div", "il-formula start"), message = make("p", "il-message");
  converter.append(controls(numberInput, make("span", "il-formula", "="), romanInput), controls(...stepButtons), legend, breakdown, sum, message);
  numberInput.addEventListener("input", () => {
    const value = Number(numberInput.value);
    if (Number.isInteger(value) && value >= 1 && value <= 3999) setNumber(value, "number");
    else showWarning("Római számmal csak az 1–3999 közötti egész számokat írjuk le.");
  });
  romanInput.addEventListener("input", () => {
    const text = romanInput.value.toUpperCase();
    const value = fromRoman(text);
    if (value !== null) setNumber(value, "roman");
    else showWarning(text ? "Ez nem szabályos római szám. Egy betű legfeljebb háromszor állhat egymás után, V, L és D pedig csak egyszer." : "Írj be római számot, például MCMXCIV-et.");
  });
  function showWarning(text) { message.className = "il-message warn"; message.textContent = text; }
  function setNumber(value, source) {
    number = Math.max(1, Math.min(3999, value));
    if (source !== "number") numberInput.value = number;
    if (source !== "roman") romanInput.value = toRoman(number);
    const parts = pieces(number);
    breakdown.replaceChildren(pieceTiles(number));
    sum.replaceChildren(`${parts.map((piece) => piece.value).join(" + ")}${parts.length > 1 ? ` = ${number}` : ""}`);
    message.className = "il-message";
    message.textContent = parts.some((piece) => SUBTRACTIVE.has(piece.roman)) ? "Sárga: kivonásos pár, a kisebb betű a nagyobb előtt (például IV = 5 − 1 = 4). Kék: összeadódó betűk." : "Itt minden betű hozzáadódik az értékhez.";
  }

  // --- Non-positional ---
  const position = card("Nem helyiértékes írásmód");
  const positionInput = make("input");
  Object.assign(positionInput, { type: "text", value: "XIX", maxLength: 15 });
  positionInput.setAttribute("aria-label", "Római szám az X vizsgálatához");
  styleInput(positionInput, 16);
  const positionValues = make("div"), positionMessage = make("p", "il-message");
  position.append(make("p", "", "Tízes számrendszerben a jegyek helye számít: 19-ben az első jegy tízest, a második egyest jelent. A római számokban viszont minden betű mindig ugyanazt jelenti, csak a helye dönti el, hogy hozzáadjuk vagy kivonjuk. Írj be egy számot:"), controls(positionInput), positionValues, positionMessage);
  positionInput.addEventListener("input", renderPosition);
  function renderPosition() {
    const text = positionInput.value.toUpperCase();
    const value = fromRoman(text);
    positionValues.replaceChildren(value === null ? "" : letterValues(text));
    positionMessage.className = value === null ? "il-message warn" : "il-message";
    positionMessage.textContent = value === null ? "Ez nem szabályos római szám." : `${text} = ${[...text].map((ch, i) => `${VALUE[ch] < (VALUE[text[i + 1]] ?? 0) ? "−" : "+"}${VALUE[ch]}`).join(" ")} = ${value}. ${text.includes("X") ? "Az X mindenhol 10 értékű, akár az elején, akár a végén áll." : ""}`;
  }

  // --- Quiz ---
  const quiz = card("Kihívás: olvasd le!");
  let level = 1, target = 0;
  const levelToggles = LEVELS.map((entry, index) => toggle(entry.name, index === level, () => { level = index; levelToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(i === level))); newQuestion(); }));
  const shown = make("div", "il-formula"), answer = make("input"), quizMessage = make("p", "il-message"), quizBreakdown = make("div");
  shown.style.cssText = "font:700 30px var(--font-mono);color:var(--accent);text-align:left;min-height:1.6em";
  Object.assign(answer, { type: "number", min: 1, max: 3999 });
  answer.setAttribute("aria-label", "Válasz");
  styleInput(answer, 9);
  const check = button("Ellenőrzés", checkAnswer);
  answer.addEventListener("keydown", (event) => { if (event.key === "Enter") checkAnswer(); });
  quiz.append(controls(make("span", "il-muted", "Nehézség:"), ...levelToggles), shown, controls(answer, check, button("Új szám", newQuestion, { ghost: true })), quizMessage, quizBreakdown);
  function newQuestion() {
    target = randomInt(1, LEVELS[level].max);
    shown.textContent = toRoman(target);
    answer.value = ""; quizMessage.className = "il-message"; quizMessage.textContent = ""; quizBreakdown.replaceChildren();
  }
  function checkAnswer() {
    const value = Number(answer.value);
    if (!answer.value) return;
    const right = value === target;
    quizMessage.className = `il-message ${right ? "good" : "warn"}`;
    quizMessage.textContent = right ? "Helyes!" : `Nem egészen: ${toRoman(target)} = ${target}. Bontsd részekre balról jobbra:`;
    quizBreakdown.replaceChildren(right ? "" : pieceTiles(target));
  }

  root.append(converter, position, quiz, keyIdea("a római számok összeadással és kivonással működnek: a betűk értékét összeadjuk, kivéve, ha kisebb betű áll nagyobb előtt (IV, IX, XL, XC, CD, CM), mert azt kivonjuk. Nincs helyiérték: az X mindig 10."));
  setNumber(number);
  renderPosition();
  newQuestion();
  return () => scope.clearAll();
}
