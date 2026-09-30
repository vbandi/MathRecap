import { button, card, controls, createScope, keyIdea, lead, make, toggle } from "./kit.js";

const PRESETS = [
  "3 + 4 · ( 5 − 2 ) ²",
  "( 12 − 4 ) : 2 + 3 ² · 2",
  "20 − 6 : 3 · 2 + 1",
  "2 · ( 3 + 4 · 2 ) − 5 ² : 5",
  "100 − ( 2 + 3 ) ² · 3",
  "48 : 6 : 2 + 5",
];
const VARIANT_SETS = [
  { numbers: [2, 3, 4, 1], operators: ["+", "·", "−"] },
  { numbers: [36, 6, 3, 2], operators: [":", "+", "·"] },
  { numbers: [8, 4, 2, 3], operators: ["−", "·", "+"] },
];
const LADDER = ["1. Zárójel (belülről kifelé)", "2. Hatvány", "3. Szorzás, osztás (balról jobbra)", "4. Összeadás, kivonás (balról jobbra)"];
const SUPERSCRIPT = { 2: "²", 3: "³" };
const tidy = (text) => text.replaceAll("( ", "(").replaceAll(" )", ")").replaceAll(" ²", "²").replaceAll(" ³", "³");

const parse = (text) => text.split(" ").map((part) => {
  if (part === "²" || part === "³") return { kind: "pow", value: part === "²" ? 2 : 3 };
  if (/^\d+$/.test(part)) return { kind: "num", value: Number(part) };
  return part === "(" || part === ")" ? { kind: "paren", value: part } : { kind: "op", value: part };
});
const tokenText = (token) => (token.kind === "pow" ? SUPERSCRIPT[token.value] : String(token.value).replace("-", "−"));
const isMulDiv = (token) => token.kind === "op" && (token.value === "·" || token.value === ":");
const isAddSub = (token) => token.kind === "op" && (token.value === "+" || token.value === "−");

// Finds the next operation by the order of operations and describes how to reduce it.
function nextStep(tokens) {
  const close = tokens.findIndex((token) => token.value === ")");
  const openIndex = close < 0 ? -1 : tokens.map((token) => token.value).lastIndexOf("(", close);
  const low = close < 0 ? 0 : openIndex + 1, high = close < 0 ? tokens.length : close;
  if (close >= 0 && high - low === 1) return { rule: 0, range: [openIndex, close], replacement: tokens[low], text: "Zárójel: belül már csak egy szám áll, ezért a zárójelet elhagyhatjuk." };
  const scope = tokens.slice(low, high), prefix = close >= 0 ? "Zárójelben: " : "";
  let index = scope.findIndex((token) => token.kind === "pow"), rule = 1;
  if (index < 0) { index = scope.findIndex(isMulDiv); rule = 2; }
  if (index < 0) { index = scope.findIndex(isAddSub); rule = 3; }
  index += low;
  if (rule === 1) {
    const base = tokens[index - 1].value, exponent = tokens[index].value, value = base ** exponent;
    return { rule, range: [index - 1, index], replacement: { kind: "num", value }, text: `${prefix}Hatvány: ${base}${SUPERSCRIPT[exponent]} = ${Array(exponent).fill(base).join(" · ")} = ${value}.` };
  }
  const a = tokens[index - 1].value, b = tokens[index + 1].value, symbol = tokens[index].value;
  const value = { "·": a * b, ":": a / b, "+": a + b, "−": a - b }[symbol];
  const sameKind = scope.filter(rule === 2 ? isMulDiv : isAddSub).length > 1;
  const weakerPresent = rule === 2 && scope.some(isAddSub);
  const name = rule === 2 ? "Szorzás/osztás" : "Összeadás/kivonás";
  const why = sameKind ? " Azonos erősségű műveletek közül a legbalszélsőt végezzük el." : weakerPresent ? " A szorzás és az osztás erősebb az összeadásnál és a kivonásnál." : "";
  return { rule, range: [index - 1, index + 1], replacement: { kind: "num", value }, text: `${prefix}${name}: ${a} ${symbol} ${b} = ${String(value).replace("-", "−")}.${why}` };
}

function evaluate(tokens) {
  let current = tokens;
  while (current.length > 1) {
    const step = nextStep(current);
    if (!Number.isInteger(step.replacement.value) || step.replacement.value < 0) return null;
    current = [...current.slice(0, step.range[0]), step.replacement, ...current.slice(step.range[1] + 1)];
  }
  return current[0].value;
}

function variantsOf({ numbers, operators }) {
  const last = numbers.length - 1, result = [];
  for (let i = 0; i < last; i++) {
    for (let j = i + 1; j <= last; j++) {
      if (i === 0 && j === last) continue;
      const parts = [];
      numbers.forEach((n, index) => {
        parts.push(index === i ? `( ${n}` : String(n));
        if (index === j) parts[parts.length - 1] += " )";
        if (index < last) parts.push(operators[index]);
      });
      const text = parts.join(" ");
      const value = evaluate(parse(text));
      if (value !== null) result.push({ text, value });
    }
  }
  const plain = numbers.flatMap((n, index) => (index < last ? [String(n), operators[index]] : [String(n)])).join(" ");
  return [{ text: plain, value: evaluate(parse(plain)) }, ...result];
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Ha egy számolásban több művelet van, nem mindegy, melyiket végezzük el előbb: 3 + 4 · 5 nem ugyanannyi, mint (3 + 4) · 5. A matematikusok megállapodtak egy sorrendben, hogy mindenki ugyanarra az eredményre jusson."));

  const main = card("Lépésről lépésre");
  let presetIndex = 0, tokens, marked, history;
  const ladder = LADDER.map((text) => { const row = make("div", "", text); row.style.cssText = "padding:4px 10px;margin:3px 0;border-radius:8px;border:1px solid var(--line);color:var(--dim);transition:background-color .2s, color .2s"; return row; });
  const line = make("div", "il-formula start");
  line.style.cssText += ";font-size:26px;min-height:2em;display:flex;flex-wrap:wrap;align-items:center;gap:0 .3em;padding-top:6px";
  const message = make("p", "il-message");
  const history_ = make("ol", "il-steps");
  const nextButton = button("Következő lépés", advance);
  const presetButtons = PRESETS.map((text, index) => toggle(`${index + 1}. példa`, index === presetIndex, () => { presetIndex = index; load(PRESETS[index]); }));
  main.append(controls(...presetButtons), ...ladder, line, message, controls(nextButton, button("Újrakezdés", () => load(PRESETS[presetIndex]), { ghost: true })), history_);

  function load(text) {
    tokens = parse(text); marked = null; history = [tidy(text)];
    presetButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(index === presetIndex)));
    message.className = "il-message"; message.textContent = "Kattints a Következő lépésre: először megmutatom, melyik műveletet végezzük el, utána el is végzem.";
    render();
  }
  function advance() {
    if (!marked) {
      marked = nextStep(tokens);
      message.className = "il-message"; message.textContent = marked.text;
    } else {
      tokens = [...tokens.slice(0, marked.range[0]), marked.replacement, ...tokens.slice(marked.range[1] + 1)];
      marked = null;
      history.push(tidy(tokens.map(tokenText).join(" ")));
      if (tokens.length === 1) { message.className = "il-message good"; message.textContent = `Kész! Az eredmény: ${tokenText(tokens[0])}.`; }
    }
    render();
  }
  function render() {
    line.replaceChildren();
    tokens.forEach((token, index) => {
      const span = make("span", "", tokenText(token));
      const inside = marked && index >= marked.range[0] && index <= marked.range[1];
      span.style.cssText = `padding:1px 3px;border-radius:6px;${inside ? "background:var(--accent);color:var(--accent-ink);" : token.kind === "op" ? "color:var(--dim);" : ""}${token.kind === "pow" ? "margin-left:-.3em;" : ""}`;
      line.append(span);
    });
    ladder.forEach((row, index) => {
      const active = marked && marked.rule === index;
      row.style.background = active ? "var(--accent)" : "transparent";
      row.style.color = active ? "var(--accent-ink)" : "var(--dim)";
    });
    history_.replaceChildren(...history.map((text) => make("li", "", text)));
    nextButton.disabled = tokens.length === 1;
  }

  // --- Parentheses change the result ---
  const variants = card("Ugyanazok a számok, más zárójelezés");
  let variantSet = 0;
  const variantList = make("div");
  const variantButtons = VARIANT_SETS.map((_, index) => toggle(`${index + 1}. számsor`, index === variantSet, () => { variantSet = index; renderVariants(); }));
  variants.append(make("p", "", "A zárójel felülírja a megszokott sorrendet. Kattints egy sorra, és a fenti lépésenkénti számoló végigvezet rajta."), controls(...variantButtons), variantList);
  function renderVariants() {
    variantButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(index === variantSet)));
    variantList.replaceChildren(...variantsOf(VARIANT_SETS[variantSet]).map(({ text, value }, index) => {
      const row = make("button", "il-toggle");
      row.type = "button";
      row.style.cssText = "display:flex;justify-content:space-between;width:100%;max-width:420px;margin:4px 0;font:17px var(--font-mono);border-radius:10px;padding:6px 14px;text-align:left";
      row.append(make("span", "", text.replaceAll("( ", "(").replaceAll(" )", ")")), make("b", "il-accent", `= ${value}`));
      if (index === 0) row.append(make("span", "il-muted", " (zárójel nélkül)"));
      row.addEventListener("click", () => { load(text); presetButtons.forEach((el) => el.setAttribute("aria-pressed", "false")); main.scrollIntoView({ behavior: "smooth", block: "start" }); });
      return row;
    }));
  }

  root.append(main, variants, keyIdea("előbb a zárójelben lévő műveletek, aztán a hatvány, majd a szorzás és osztás, végül az összeadás és kivonás. Azonos szintű műveleteket balról jobbra végzünk el. A zárójel ezt a sorrendet bármikor átírhatja."));
  load(PRESETS[0]);
  renderVariants();
  return () => scope.clearAll();
}
