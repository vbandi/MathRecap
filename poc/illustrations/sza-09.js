import { button, card, controls, createScope, keyIdea, lead, make, PALETTE } from "./kit.js";

const NBSP = " ";
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const digitList = (n) => String(n).split("").map(Number);
const digitSum = (n) => digitList(n).reduce((a, b) => a + b, 0);
const lastDigits = (n, count) => n % 10 ** count;

// The number written digit by digit; digits from index `from` on are highlighted.
function digitsView(n, from) {
  const view = make("span");
  view.style.cssText = "font-family:var(--font-mono);font-size:18px;letter-spacing:.08em";
  digitList(n).forEach((digit, index) => {
    const span = make("span", "", String(digit));
    if (index >= from) span.style.cssText = `color:var(--accent-ink);background:var(--accent);border-radius:4px;padding:0 2px;margin:0 1px`;
    view.append(span);
  });
  return view;
}

function rulesFor(n) {
  const s = digitSum(n), last = n % 10, two = lastDigits(n, 2), length = String(n).length;
  const by2 = last % 2 === 0, by3 = s % 3 === 0;
  return [
    { d: 2, rule: "az utolsó jegy páros (0, 2, 4, 6, 8)", view: () => digitsView(n, length - 1), text: `utolsó jegy: ${last}`, ok: by2 },
    { d: 3, rule: "a számjegyek összege osztható 3-mal", view: () => digitsView(n, 0), text: `összeg: ${digitList(n).join(" + ")} = ${s}`, ok: by3 },
    { d: 4, rule: "az utolsó két jegy által alkotott szám osztható 4-gyel", view: () => digitsView(n, Math.max(0, length - 2)), text: `${two} : 4 ${two % 4 === 0 ? "kijön" : "nem jön ki"}`, ok: two % 4 === 0 },
    { d: 5, rule: "az utolsó jegy 0 vagy 5", view: () => digitsView(n, length - 1), text: `utolsó jegy: ${last}`, ok: last === 0 || last === 5 },
    { d: 6, rule: "osztható 2-vel és 3-mal is", view: () => digitsView(n, length), text: `2-vel: ${by2 ? "igen" : "nem"}, 3-mal: ${by3 ? "igen" : "nem"}`, ok: by2 && by3 },
    { d: 9, rule: "a számjegyek összege osztható 9-cel", view: () => digitsView(n, 0), text: `összeg: ${s}`, ok: s % 9 === 0 },
    { d: 10, rule: "az utolsó jegy 0", view: () => digitsView(n, length - 1), text: `utolsó jegy: ${last}`, ok: last === 0 },
    { d: 100, rule: "az utolsó két jegy 00", view: () => digitsView(n, Math.max(0, length - 2)), text: `utolsó két jegy: ${String(two).padStart(2, "0")}`, ok: two === 0 },
  ];
}

export function mount(root) {
  const scope = createScope();
  let n = 4716;
  root.append(lead("Nem kell elosztanod egy nagy számot, hogy megtudd, osztható-e valamivel: elég ránézned a számjegyeire. Írj be egy számot, és nézd meg, melyik szabály mit vizsgál."));

  // --- Rule panel ---
  const panel = card("Mely számokkal osztható?");
  const input = make("input");
  Object.assign(input, { type: "number", min: 1, max: 999999, value: n });
  input.setAttribute("aria-label", "Vizsgált szám");
  input.style.cssText = "width:11ch;padding:7px 10px;border:1px solid var(--line-strong);border-radius:10px;background:var(--input);color:var(--fg);font:18px var(--font-mono)";
  input.addEventListener("input", () => { const value = Number(input.value); if (Number.isInteger(value) && value >= 1 && value <= 999999) setNumber(value, false); });
  const rows = make("div");
  panel.append(controls(input, button("Véletlen szám", () => setNumber(randomInt(10, 99999), true)), button("Osztható 6-tal", () => setNumber(randomInt(2, 16666) * 6, true), { ghost: true })), rows);
  function renderRules() {
    rows.replaceChildren(...rulesFor(n).map(({ d, rule, view, text, ok }) => {
      const row = make("div");
      row.style.cssText = `display:grid;grid-template-columns:3.2ch 1fr 2.4ch;gap:4px 12px;align-items:center;padding:8px 10px;margin:5px 0;border:1px solid ${ok ? PALETTE.green : "var(--line)"};border-radius:10px;background:var(--input)`;
      const badge = make("b", "il-accent", String(d)), body = make("div"), mark = make("b", "", ok ? "✓" : "✗");
      badge.style.fontSize = "18px";
      mark.style.cssText = `font-size:20px;color:${ok ? PALETTE.green : PALETTE.red}`;
      const hint = make("div", "il-muted", `${rule}`);
      const detail = make("div");
      detail.style.cssText = "display:flex;flex-wrap:wrap;gap:2px 14px;align-items:baseline";
      detail.append(view(), make("span", "il-muted", text));
      body.append(hint, detail);
      row.append(badge, body, mark);
      return row;
    }));
  }
  function setNumber(value, updateInput) {
    n = value;
    if (updateInput) input.value = n;
    renderRules(); resetSum(); renderWhy();
  }

  // --- Digit sum animation ---
  const sumCard = card("Számjegyösszeg lépésenként");
  const sumLine = make("div", "il-formula start"), sumMessage = make("p", "il-message");
  sumLine.style.cssText += ";font-size:22px;min-height:3.3em";
  let timer;
  const runButton = button("Összegezd a jegyeket", runSum);
  sumCard.append(controls(runButton), sumLine, sumMessage);
  function resetSum() {
    if (timer) scope.clearInterval(timer);
    timer = null; sumLine.textContent = ""; sumMessage.className = "il-message"; sumMessage.textContent = "Nyomd meg a gombot: a jegyek egyesével összeadódnak.";
  }
  function runSum() {
    resetSum();
    const digits = digitList(n);
    let index = 0, running = 0;
    timer = scope.interval(() => {
      running += digits[index];
      sumLine.textContent = `${digits.slice(0, index + 1).join(" + ")} = ${running}`;
      index += 1;
      if (index < digits.length) return;
      scope.clearInterval(timer); timer = null;
      const extra = running >= 10 ? ` Tovább is összeadhatod: ${digitList(running).join(" + ")} = ${digitSum(running)}.` : "";
      sumMessage.className = "il-message good";
      sumMessage.textContent = `Az összeg ${running}: 3-mal ${running % 3 === 0 ? "osztható" : "nem osztható"}, 9-cel ${running % 9 === 0 ? "osztható" : "nem osztható"}, tehát ${n} is ugyanígy. ${extra}`;
    }, 600);
  }

  // --- Why ---
  const why = card("Miért működik?");
  const whyLines = make("div", "il-formula start");
  whyLines.style.cssText += ";font-size:16px;line-height:1.9";
  const whyText = make("p", "il-message");
  why.append(make("p", "", "10 = 9 + 1, 100 = 99 + 1, 1000 = 999 + 1, vagyis minden tízhatvány eggyel több egy csupa 9-esből álló számnál, az pedig osztható 9-cel és 3-mal. Ezért a számjegyek helyi értéke „levágható”, és csak a számjegyek összege marad. A 100 viszont osztható 4-gyel, ezért 4-nél csak az utolsó két jegy számít."), whyLines, whyText);
  function renderWhy() {
    const digits = digitList(n), s = digitSum(n), length = digits.length;
    whyLines.replaceChildren(
      `${n} = ${digits.map((digit, index) => `${digit} · ${10 ** (length - 1 - index)}`).join(" + ")}`, make("br"),
      `${NBSP}${NBSP}= ${digits.map((digit, index) => { const k = length - 1 - index; return k ? `(${digit} · ${"9".repeat(k)} + ${digit})` : `${digit}`; }).join(" + ")}`, make("br"),
      `${NBSP}${NBSP}= (9-cel osztható rész) + (${digits.join(" + ")})`,
    );
    whyText.className = "il-message";
    whyText.textContent = `${n} = 9 · ${(n - s) / 9} + ${s}: a szám és a számjegyösszege (${s}) ugyanazt a maradékot adja 9-cel osztva (${s % 9}), 3-mal osztva pedig ${s % 3}.`;
  }

  root.append(panel, sumCard, why, keyIdea("az oszthatóság a számjegyekből eldönthető. A 2, 5, 10 az utolsó jegyre, a 4 és a 100 az utolsó két jegyre figyel (mert a 100 már osztható velük), a 3 és a 9 a számjegyek összegére, a 6 pedig akkor működik, ha a 2 és a 3 szabálya is teljesül."));
  renderRules(); resetSum(); renderWhy();
  return () => scope.clearAll();
}
