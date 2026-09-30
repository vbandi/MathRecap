import { button, card, controls, createScope, formatNumber, fraction, gcd, keyIdea, lead, make, PALETTE, rich, stepper, svg, withInstrumental } from "./kit.js";

const BAR_X = 20, BAR_WIDTH = 560, BAR_HEIGHT = 54, MAX_DENOMINATOR = 24;
const COMPARISON_PAIRS = [[[2, 3], [3, 4]], [[3, 5], [2, 3]], [[5, 8], [3, 5]], [[3, 4], [5, 7]], [[5, 6], [7, 9]]];

const lcm = (a, b) => (a * b) / gcd(a, b);
const reducedKey = (i, d) => `${i / gcd(i, d)}/${d / gcd(i, d)}`;

// A bar split into equal parts. Cut lines are keyed by their position as a reduced
// fraction, so lines that stay in place survive while new cuts fade in.
function fractionBar(parent, color, scope) {
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 600 ${BAR_HEIGHT + 20}`, role: "img" }, parent);
  svg("rect", { x: BAR_X, y: 10, width: BAR_WIDTH, height: BAR_HEIGHT, rx: 6, style: "fill:var(--surface)" }, figure);
  const filled = svg("rect", { x: BAR_X, y: 10, width: BAR_WIDTH, height: BAR_HEIGHT, rx: 6, class: "il-move", style: `fill:${color};transform-origin:${BAR_X}px 0` }, figure);
  const cuts = svg("g", {}, figure);
  svg("rect", { x: BAR_X, y: 10, width: BAR_WIDTH, height: BAR_HEIGHT, rx: 6, fill: "none", style: "stroke:var(--line-strong);stroke-width:2" }, figure);
  const lines = new Map();

  return {
    set(numerator, denominator) {
      figure.setAttribute("aria-label", `${denominator} egyenlő részre osztott sáv, ebből ${numerator} rész színes`);
      filled.style.transform = `scaleX(${numerator / denominator})`;
      const wanted = new Set();
      for (let i = 1; i < denominator; i++) {
        const key = reducedKey(i, denominator);
        wanted.add(key);
        if (lines.has(key)) continue;
        const x = BAR_X + (BAR_WIDTH * i) / denominator;
        const line = svg("line", { x1: x, x2: x, y1: 10, y2: 10 + BAR_HEIGHT, class: "il-fade", opacity: 0, style: "stroke:var(--bg);stroke-width:3" }, cuts);
        lines.set(key, line);
        scope.frame(() => scope.frame(() => line.setAttribute("opacity", 1)));
      }
      for (const [key, line] of lines) {
        if (wanted.has(key)) continue;
        lines.delete(key);
        line.setAttribute("opacity", 0);
        scope.timeout(() => line.remove(), 450);
      }
    },
  };
}

function smallestCommonDivisor(a, b) {
  const divisor = gcd(a, b);
  for (let candidate = 2; candidate <= divisor; candidate++) if (divisor % candidate === 0) return candidate;
  return 1;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A tört egy egész egyenlő részeit számolja: a nevező mondja meg, hány egyenlő részre vágtuk, a számláló, hogy hányat veszünk belőle. Ha minden részt tovább vágunk (bővítés) vagy részeket összevonunk (egyszerűsítés), a szám alakja változik, a mennyiség nem."));

  // --- Expanding and simplifying one fraction ---
  const state = { numerator: 3, denominator: 4, chain: [[3, 4]] };
  const main = card("Bővítés és egyszerűsítés");
  const numeratorControl = stepper({ label: "Számláló", min: 0, max: MAX_DENOMINATOR, value: state.numerator, onChange: (value) => setFraction(value, state.denominator) });
  const denominatorControl = stepper({ label: "Nevező", min: 1, max: MAX_DENOMINATOR, value: state.denominator, onChange: (value) => setFraction(state.numerator, value) });
  main.append(controls(numeratorControl.element, denominatorControl.element));
  const bar = fractionBar(main, PALETTE.blue, scope);
  const chain = make("div", "il-formula start");
  const message = make("p", "il-message");
  const expandTwo = button("Bővítés 2-vel", () => expand(2));
  const expandThree = button("Bővítés 3-mal", () => expand(3));
  const simplify = button("Egyszerűsítés", () => reduce(smallestCommonDivisor(state.numerator, state.denominator)), { ghost: true });
  const simplest = button("Legegyszerűbb alak", () => reduce(gcd(state.numerator, state.denominator)), { ghost: true });
  main.append(chain, controls(expandTwo, expandThree, simplify, simplest), message);
  root.append(main);

  function setFraction(numerator, denominator) {
    state.numerator = Math.min(numerator, denominator);
    state.denominator = denominator;
    state.chain = [[state.numerator, state.denominator]];
    message.textContent = "";
    render();
  }

  function expand(factor) {
    const [n, d] = [state.numerator, state.denominator];
    state.numerator *= factor; state.denominator *= factor;
    state.chain.push([state.numerator, state.denominator]);
    message.textContent = `Minden részt ${factor} egyenlő darabra vágtunk: ${n}/${d} → ${state.numerator}/${state.denominator}. A színes rész ugyanakkora maradt.`;
    render();
  }

  function reduce(divisor) {
    if (divisor < 2) return;
    const [n, d] = [state.numerator, state.denominator];
    state.numerator /= divisor; state.denominator /= divisor;
    state.chain.push([state.numerator, state.denominator]);
    message.textContent = `Mindig ${divisor} szomszédos részt vontunk össze eggyé: ${n}/${d} → ${state.numerator}/${state.denominator}. A számlálót és a nevezőt is ${withInstrumental(divisor)} osztottuk.`;
    render();
  }

  function render() {
    numeratorControl.set(state.numerator);
    denominatorControl.set(state.denominator);
    bar.set(state.numerator, state.denominator);
    const parts = [];
    state.chain.forEach(([n, d], index) => { if (index) parts.push(" = "); parts.push(fraction(n, d)); });
    chain.replaceChildren(rich(...parts, ` = ${formatNumber(state.numerator / state.denominator)}`));
    const common = gcd(state.numerator, state.denominator);
    expandTwo.disabled = state.denominator * 2 > MAX_DENOMINATOR;
    expandThree.disabled = state.denominator * 3 > MAX_DENOMINATOR;
    simplify.disabled = simplest.disabled = common < 2;
  }

  // --- Comparing two fractions via a common denominator ---
  const compare = card("Melyik a nagyobb?");
  compare.append(make("p", "", "Két különböző nevezőjű törtet nehéz ránézésre összehasonlítani. Vágjuk mindkettőt ugyanannyi részre!"));
  const barA = fractionBar(compare, PALETTE.violet, scope);
  const labelA = make("div", "il-formula");
  compare.append(labelA);
  const barB = fractionBar(compare, PALETTE.green, scope);
  const labelB = make("div", "il-formula");
  const compareMessage = make("p", "il-message");
  let pairIndex = 0, common = false;
  const commonButton = button("Közös nevezőre hozás", () => { common = true; renderComparison(); });
  compare.append(labelB, controls(commonButton, button("Új pár", () => { pairIndex = (pairIndex + 1) % COMPARISON_PAIRS.length; common = false; renderComparison(); }, { ghost: true })), compareMessage);
  root.append(compare, keyIdea("ha a számlálót és a nevezőt is ugyanazzal a (nem nulla) számmal szorozzuk vagy osztjuk, a tört értéke nem változik. Ezért lehet bármely két törtet közös nevezőre hozni, és utána csak a számlálókat kell összehasonlítani."));

  function renderComparison() {
    const [[n1, d1], [n2, d2]] = COMPARISON_PAIRS[pairIndex];
    const target = lcm(d1, d2);
    const [a, b] = common ? [[n1 * target / d1, target], [n2 * target / d2, target]] : [[n1, d1], [n2, d2]];
    barA.set(...a); barB.set(...b);
    labelA.replaceChildren(common ? rich(fraction(n1, d1), " = ", fraction(...a)) : fraction(n1, d1));
    labelB.replaceChildren(common ? rich(fraction(n2, d2), " = ", fraction(...b)) : fraction(n2, d2));
    commonButton.disabled = common;
    const relation = a[0] > b[0] ? ">" : a[0] < b[0] ? "<" : "=";
    compareMessage.className = common ? "il-message good" : "il-message";
    compareMessage.replaceChildren(common
      ? rich(`Mindkét nevező ${target}: `, fraction(...a), ` ${relation} `, fraction(...b), ", tehát ", fraction(n1, d1), ` ${relation} `, fraction(n2, d2), ".")
      : `Tipp: ${d1} és ${d2} legkisebb közös többszöröse ${target}.`);
  }

  render();
  renderComparison();
  return () => scope.clearAll();
}
