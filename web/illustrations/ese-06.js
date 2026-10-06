import { button, card, controls, createScope, fraction, keyIdea, lead, make, PALETTE, rich, stepper, withInstrumental } from "./kit.js";

const LETTERS = "ABCDEFG";
const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink, "var(--dim)"];
const MAX_SHOWN = 24;

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const choose = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
const permute = (items) => (items.length <= 1 ? [items] : items.flatMap((item, i) => permute([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])));
function subsets(size, take) {
  const result = [];
  const recurse = (start, current) => {
    if (current.length === take) { result.push(current.slice()); return; }
    for (let i = start; i < size; i++) { current.push(i); recurse(i + 1, current); current.pop(); }
  };
  recurse(0, []);
  return result;
}

// binomial coefficient notation: n over k in parentheses, no bar
function binom(n, k) {
  const element = make("span");
  element.style.cssText = "display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.15;padding:0 7px;border-left:1.5px solid currentColor;border-right:1.5px solid currentColor;border-radius:8px;margin:0 3px";
  element.append(make("span", "", String(n)), make("span", "", String(k)));
  return element;
}

function chips(indexes) {
  return indexes.map((i) => {
    const element = make("span", "", LETTERS[i]);
    element.style.cssText = `display:inline-block;min-width:22px;padding:1px 0;border-radius:7px;background:${COLORS[i]};color:#fff;font:700 13px var(--font-mono);text-align:center`;
    return element;
  });
}

export function mount(root) {
  const scope = createScope();
  let n = 5, k = 3, merged = false;

  root.append(lead("Ha kiválasztunk néhány dolgot egy nagyobb csoportból, és csak az számít, hogy kik kerültek be (a sorrend nem számít), akkor kombinációt számolunk. Ez kevesebb, mint a sorrendes választás, mert ugyanaz a csapat több sorrendben is előjön."));

  const setup = card("Hány tagú csapatot választunk?");
  const nStepper = stepper({ label: "Összes elem (n)", min: 3, max: 7, value: n, onChange: (value) => { n = value; if (k > n - 1) { k = n - 1; kStepper.set(k); } rebuild(); } });
  const kStepper = stepper({ label: "Kiválasztott (k)", min: 1, max: 6, value: k, onChange: (value) => { k = Math.min(value, n - 1); kStepper.set(k); rebuild(); } });
  const formula = make("div", "il-formula start");
  setup.append(controls(nStepper.element, kStepper.element), formula);

  const stepOne = card("1. lépés: számoljuk a sorrendet is");
  const orderedLine = make("p");
  stepOne.append(orderedLine);

  const stepTwo = card("2. lépés: ugyanaz a csapat annyiszor szerepel, ahányféleképp a tagjait sorba lehet állítani");
  const teamText = make("p", "il-muted");
  const orderingBox = make("div");
  orderingBox.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;min-height:40px";
  const mergeText = make("p", "il-message");
  stepTwo.append(teamText, orderingBox, controls(button("Vonjuk össze őket!", () => { setMerged(true); }), button("Vissza", () => { setMerged(false); }, { ghost: true })), mergeText);

  const stepThree = card("3. lépés: az összes lehetséges csapat");
  const teamList = make("div");
  teamList.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
  stepThree.append(teamList);

  root.append(setup, stepOne, stepTwo, stepThree, keyIdea("a kombinációk száma = a sorrendes választások száma ÷ egy csapat sorbaállításainak száma: ",
    rich(binom("n", "k"), " = ", fraction("n!", "k! · (n − k)!"), ". Szimmetria: ", binom("n", "k"), " = ", binom("n", "n − k"), ", mindegy, hogy kiket választunk be, vagy kiket hagyunk ki.")));

  let boxes = [];

  function setMerged(value) {
    merged = value;
    const first = boxes[0]?.getBoundingClientRect();
    boxes.forEach((box, i) => {
      if (i === 0) { box.style.borderColor = merged ? "var(--accent)" : "var(--line)"; return; }
      scope.timeout(() => {
        if (merged) {
          const rect = box.getBoundingClientRect();
          box.style.transform = `translate(${first.left - rect.left}px, ${first.top - rect.top}px)`;
          box.style.opacity = "0";
        } else { box.style.transform = ""; box.style.opacity = "1"; }
      }, i * 40);
    });
    renderMergeText();
  }

  function renderMergeText() {
    const ordered = factorial(n) / factorial(n - k);
    mergeText.textContent = merged
      ? `Ez mind ugyanaz az egy csapat (${factorial(k)} sorrend). Ezért osztunk ${withInstrumental(factorial(k))}: ${ordered} ÷ ${factorial(k)} = ${choose(n, k)}.`
      : `Sorrenddel számolva ezek mind külön esetek, de valójában egyetlen csapat: ${factorial(k)} sorrend, 1 valódi csapat.`;
  }

  function rebuild() {
    merged = false;
    const ordered = factorial(n) / factorial(n - k);
    const team = Array.from({ length: k }, (_, i) => i);
    formula.replaceChildren(rich(binom(n, k), ` = `, fraction(`${n}!`, `${k}! · ${n - k}!`), " = "), make("b", "", String(choose(n, k))));
    orderedLine.replaceChildren(`Ha a sorrend is számít: ${Array.from({ length: k }, (_, i) => n - i).join(" · ")} = `, make("b", "", String(ordered)), " lehetséges kiválasztás.");
    teamText.textContent = `Alább a {${team.map((i) => LETTERS[i]).join(", ")}} csapat összes sorrendje (legfeljebb ${MAX_SHOWN} látszik).`;
    orderingBox.replaceChildren();
    const orders = permute(team);
    boxes = orders.slice(0, MAX_SHOWN).map((order) => {
      const box = make("div");
      box.style.cssText = "display:flex;gap:2px;padding:3px;border:1px solid var(--line);border-radius:9px;transition:transform .6s cubic-bezier(.45,0,.2,1),opacity .4s";
      box.append(...chips(order));
      orderingBox.append(box);
      return box;
    });
    if (orders.length > MAX_SHOWN) orderingBox.append(make("span", "il-muted", `… és még ${orders.length - MAX_SHOWN} sorrend`));
    renderMergeText();
    teamList.replaceChildren(...subsets(n, k).map((subset) => {
      const box = make("div");
      box.style.cssText = "display:flex;gap:2px;padding:3px;border:1px solid var(--line-strong);border-radius:9px";
      box.append(...chips(subset));
      return box;
    }));
  }

  rebuild();
  return () => scope.clearAll();
}
