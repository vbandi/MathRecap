import { button, card, controls, createScope, equation, keyIdea, lead, make, rich, toggle } from "./kit.js";

const fmt = (n) => (n < 0 ? `(−${-n})` : String(n));
const flag = (value) => (value ? "igaz" : "hamis");
const SENTENCES = [
  { label: "x + 3 < 7", test: (x) => x + 3 < 7, show: (x) => `${fmt(x)} + 3 < 7`, middle: (x) => `${show(x + 3)} < 7` },
  { label: "x páros és x < 10", test: (x) => x % 2 === 0 && x < 10, show: (x) => `${fmt(x)} páros és ${fmt(x)} < 10`, middle: (x) => `páros: ${flag(x % 2 === 0)}, kisebb 10-nél: ${flag(x < 10)}` },
  { label: "x² = 16", test: (x) => x * x === 16, show: (x) => `${fmt(x)}² = 16`, middle: (x) => `${x * x} = 16` },
];
const BASES = [
  { name: "természetes számok 1-től 10-ig", values: Array.from({ length: 10 }, (_, i) => i + 1) },
  { name: "egészek −5-től 5-ig", values: Array.from({ length: 11 }, (_, i) => i - 5) },
];
const show = (n) => String(n).replace("-", "−");
const joinSet = (values) => (values.length ? `{ ${values.map(show).join("; ")} }` : "∅");

export function mount(root) {
  const scope = createScope();
  const state = { sentence: 2, base: 0, marks: new Map(), scanning: null, scanDone: false };

  root.append(lead("A nyitott mondat olyan mondat, amiben van egy ismeretlen, például „x + 3 < 7”. Amíg nem tudjuk, mi az x, nem igaz és nem hamis. Behelyettesítve viszont már igen. Azoknak az értékeknek a halmazát, amelyekre igaz lesz, igazsághalmaznak hívjuk."));

  const play = card("Melyik értéknél igaz?");
  const sentencePicker = make("div", "il-controls"), basePicker = make("div", "il-controls");
  const cellRow = make("div");
  cellRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin:12px 0";
  const substitution = make("div");
  substitution.style.cssText = "min-height:3.4em;padding:10px 14px;border:1px solid var(--line-strong);border-radius:12px;background:var(--input);font:16px/1.6 var(--font-mono);color:var(--fg-soft)";
  const resultLine = make("div");
  const note = make("p", "il-message");
  const scanButton = button("Végigpróbálom", scan);
  play.append(make("div", "il-muted", "Nyitott mondat:"), sentencePicker, make("div", "il-muted", "Alaphalmaz (ezekből az értékekből választhatunk):"), basePicker, cellRow, substitution, controls(scanButton, button("Törlés", () => reset(), { ghost: true })), resultLine, note);
  root.append(play, keyIdea("az igazsághalmaz attól függ, honnan választhatunk értéket: ugyanaz a nyitott mondat más alaphalmazon más igazsághalmazt adhat."));

  const values = () => BASES[state.base].values;
  const sentence = () => SENTENCES[state.sentence];

  function evaluate(x) {
    const truth = sentence().test(x);
    state.marks.set(x, truth);
    substitution.textContent = `x = ${show(x)}:  ${sentence().show(x)}  →  ${sentence().middle(x)}  →  ${flag(truth)}`;
    substitution.style.color = truth ? "var(--accent)" : "var(--fg-soft)";
  }

  function reset() {
    scope.clearAll();
    state.marks.clear(); state.scanning = null; state.scanDone = false;
    substitution.textContent = "Kattints egy értékre, vagy nyomd meg a „Végigpróbálom” gombot.";
    substitution.style.color = "";
    render();
  }

  function scan() {
    reset();
    const list = values();
    const step = (i) => {
      if (i >= list.length) { state.scanning = null; state.scanDone = true; return render(); }
      state.scanning = list[i];
      evaluate(list[i]);
      render();
      scope.timeout(() => step(i + 1), 700);
    };
    step(0);
  }

  function render() {
    sentencePicker.replaceChildren(...SENTENCES.map((s, i) => toggle(s.label, state.sentence === i, () => { state.sentence = i; reset(); })));
    basePicker.replaceChildren(...BASES.map((b, i) => toggle(b.name, state.base === i, () => { state.base = i; reset(); })));
    cellRow.replaceChildren();
    for (const x of values()) {
      const mark = state.marks.get(x);
      const cell = make("button", "il-toggle", show(x));
      cell.type = "button";
      const colour = state.scanning === x ? "var(--il-amber)" : mark === true ? "var(--il-green)" : mark === false ? "var(--il-red)" : "";
      cell.style.cssText = `min-width:44px;padding:8px 0;text-align:center;border-radius:10px;font:600 15px var(--font-mono);${colour ? `background:${colour};border-color:${colour};color:#fff;` : ""}${mark === false && state.scanning !== x ? "opacity:.55;" : ""}`;
      cell.addEventListener("click", () => { if (state.scanning === null) { evaluate(x); render(); } });
      cellRow.append(cell);
    }
    scanButton.disabled = state.scanning !== null;
    const trueSoFar = values().filter((x) => state.marks.get(x) === true);
    const complete = values().every((x) => state.marks.has(x));
    resultLine.replaceChildren(equation("igazsághalmaz", rich(make("span", "il-accent", joinSet(trueSoFar)), complete ? "" : " …")));
    if (!complete) note.textContent = state.marks.size ? "Még nem néztél meg minden értéket, ezért a halmaz még nem biztos, hogy teljes." : "";
    else {
      const other = BASES.map((b) => `${b.name}: ${joinSet(b.values.filter(sentence().test))}`);
      note.textContent = `Kész, minden értéket megvizsgáltunk. Ugyanez a mondat máshol: ${other.join(" · ")}.`;
    }
    note.className = `il-message ${complete ? "good" : ""}`;
  }

  reset();
  return () => scope.clearAll();
}
