import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, stepper, svg, toggle } from "./kit.js";

// Figure patterns: elements(n) lists the pieces of the n-th figure, `born` is the figure they first appear in.
const PATTERNS = {
  matches: {
    label: "Gyufaszálak",
    noun: "gyufaszál",
    question: "Hány gyufaszálra lesz szükség a 4. alakzathoz?",
    count: (n) => 3 * n + 1,
    explain: "Minden új négyzethez 3 új gyufaszál kell, ezért a darabszám mindig 3-mal nő: 4, 7, 10, 13, …",
    elements(n) {
      const size = 26, list = [];
      for (let i = 0; i < n; i++) {
        list.push({ x1: i * size, y1: 0, x2: (i + 1) * size, y2: 0, born: i + 1 });
        list.push({ x1: i * size, y1: size, x2: (i + 1) * size, y2: size, born: i + 1 });
        list.push({ x1: (i + 1) * size, y1: 0, x2: (i + 1) * size, y2: size, born: i + 1 });
        if (i === 0) list.push({ x1: 0, y1: 0, x2: 0, y2: size, born: 1 });
      }
      return list;
    },
  },
  dots: {
    label: "Pontok",
    noun: "pont",
    question: "Hány pontból áll a 4. alakzat?",
    count: (n) => (n * (n + 1)) / 2,
    explain: "A 2. alakzatnál 2, a 3.-nál 3, a 4.-nél 4 új pont kerül a legalsó sorba, ezért a darabszám egyre nagyobbat nő: 1, 3, 6, 10, …",
    elements(n) {
      const gap = 26, list = [];
      for (let row = 1; row <= n; row++) for (let col = 0; col < row; col++) list.push({ cx: (col - (row - 1) / 2) * gap + (n - 1) * gap / 2, cy: (row - 1) * gap, born: row });
      return list;
    },
  },
};

const SEQUENCES = [
  { terms: [2, 5, 8, 11, 14, 17], rule: "Minden tag 3-mal nagyobb az előzőnél: a szabály +3.", arithmetic: true },
  { terms: [3, 6, 12, 24, 48, 96], rule: "Minden tag az előző kétszerese: a szabály ·2.", arithmetic: false },
  { terms: [1, 4, 9, 16, 25, 36], rule: "Az n-edik tag az n négyzete (n·n): ezek a négyzetszámok. A különbségek a páratlan számok.", arithmetic: false },
  { terms: [1, 1, 2, 3, 5, 8], rule: "Minden tag az előző kettő összege. Ezt Fibonacci-sorozatnak hívják.", arithmetic: false },
  { terms: [20, 17, 14, 11, 8, 5], rule: "Minden tag 3-mal kisebb az előzőnél: a szabály −3.", arithmetic: true },
];
const SHOWN = 4;

export function mount(root) {
  const scope = createScope();
  root.append(lead("A sorozat olyan számok (vagy alakzatok) egymás utáni listája, amelyekben van valamilyen szabály. Ha észreveszed a szabályt, meg tudod mondani, mi jön legközelebb."));

  // ---- Card 1: growing figures ----
  const figures = card("Rajzold a következőt");
  const fig = { pattern: "matches", answer: 4, revealed: false };
  const tabs = make("div", "il-controls");
  const picture = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" });
  const questionLine = make("p");
  const figMessage = make("p", "il-message");
  const answerStepper = stepper({ label: "Szerinted", min: 0, max: 30, value: fig.answer, onChange: (value) => { fig.answer = value; } });

  figures.append(tabs, picture, questionLine, controls(answerStepper.element, button("Ellenőrzés", checkFigure), button("Mutasd a 4. alakzatot", () => { fig.revealed = true; drawFigures(); }, { ghost: true })), figMessage);

  function renderTabs() {
    tabs.replaceChildren(...Object.entries(PATTERNS).map(([key, pattern]) => toggle(pattern.label, key === fig.pattern, () => {
      fig.pattern = key; fig.revealed = false; figMessage.textContent = ""; figMessage.className = "il-message";
      renderTabs(); drawFigures();
    })));
  }

  function drawFigures() {
    const pattern = PATTERNS[fig.pattern];
    picture.replaceChildren();
    questionLine.textContent = pattern.question;
    const cells = fig.revealed ? 4 : 3;
    for (let n = 1; n <= 4; n++) {
      const left = (n - 1) * 150 + 20, group = svg("g", { transform: `translate(${left} 48)` }, picture);
      svg("text", { x: 55, y: -22, "text-anchor": "middle", text: `${n}. alakzat`, style: "fill:var(--dim)" }, group);
      if (n > cells) {
        svg("rect", { x: 0, y: -8, width: 110, height: 110, rx: 12, fill: "none", style: "stroke:var(--line-strong);stroke-width:2;stroke-dasharray:6 6" }, group);
        svg("text", { x: 55, y: 58, "text-anchor": "middle", text: "?", style: "fill:var(--dim);font-size:34px;font-weight:700" }, group);
        continue;
      }
      const pieces = svg("g", { transform: `translate(${fig.pattern === "matches" ? 2 : 16} ${fig.pattern === "matches" ? 30 : 10})` }, group);
      for (const piece of pattern.elements(n)) {
        const color = n > 1 && piece.born === n && n === 4 && fig.revealed ? PALETTE.amber : "var(--accent)";
        if (fig.pattern === "matches") svg("line", { x1: piece.x1, y1: piece.y1, x2: piece.x2, y2: piece.y2, style: `stroke:${color};stroke-width:5;stroke-linecap:round` }, pieces);
        else svg("circle", { cx: piece.cx, cy: piece.cy, r: 8, style: `fill:${color}` }, pieces);
      }
    }
  }

  function checkFigure() {
    const pattern = PATTERNS[fig.pattern], correct = pattern.count(4);
    fig.revealed = true;
    drawFigures();
    if (fig.answer === correct) {
      figMessage.className = "il-message good";
      figMessage.textContent = `Stimmel: ${correct} ${pattern.noun} kell (a narancs az újonnan hozzáadottakat mutatja). ${pattern.explain}`;
    } else {
      figMessage.className = "il-message warn";
      figMessage.textContent = `Nem ${fig.answer}, hanem ${correct} ${pattern.noun} van a 4. alakzatban. Nézd meg, mi jön hozzá az előző alakzathoz képest! ${pattern.explain}`;
    }
  }

  // ---- Card 2: number sequences ----
  const numbers = card("Folytasd a számsort");
  const seq = { index: 0, known: SHOWN, showDiffs: false };
  const table = make("table", "il-table");
  const input = make("input");
  Object.assign(input, { type: "number", placeholder: "?", ariaLabel: "A következő tag" });
  input.style.cssText = "width:7ch;padding:6px 8px;border:1px solid var(--line-strong);border-radius:9px;background:var(--input);color:var(--fg)";
  const seqMessage = make("p", "il-message");
  const diffToggle = toggle("Különbségek mutatása", false, () => { seq.showDiffs = !seq.showDiffs; diffToggle.setAttribute("aria-pressed", String(seq.showDiffs)); renderSequence(); });
  const guessButton = button("Ellenőrzés", guessTerm);
  input.addEventListener("keydown", (event) => { if (event.key === "Enter") guessTerm(); });
  numbers.append(make("p", "", "Az első négy tagot látod. Mi a szabály, és mi jön utána?"), table, controls(make("span", "", "Következő tag:"), input, guessButton, diffToggle, button("Másik sorozat", nextSequence, { ghost: true })), seqMessage);

  function renderSequence() {
    const current = SEQUENCES[seq.index], total = current.terms.length;
    const row = (heading, cell) => {
      const tr = make("tr");
      tr.append(make("th", "", heading));
      for (let i = 0; i < total; i++) tr.append(make("td", "", cell(i)));
      return tr;
    };
    const rows = [
      row("n", (i) => String(i + 1)),
      row("tag", (i) => (i < seq.known ? String(current.terms[i]) : i === seq.known ? "?" : "·")),
    ];
    if (seq.showDiffs) rows.push(row("különbség", (i) => (i >= 1 && i < seq.known ? `${current.terms[i] - current.terms[i - 1] >= 0 ? "+" : "−"}${Math.abs(current.terms[i] - current.terms[i - 1])}` : "")));
    table.replaceChildren(...rows);
    const done = seq.known >= total;
    input.disabled = guessButton.disabled = done;
  }

  function guessTerm() {
    const current = SEQUENCES[seq.index];
    if (seq.known >= current.terms.length || input.value === "") return;
    const value = Number(input.value), expected = current.terms[seq.known];
    if (value === expected) {
      seq.known += 1;
      input.value = "";
      if (seq.known >= current.terms.length) {
        seqMessage.className = "il-message good";
        seqMessage.textContent = `${current.rule}${current.arithmetic ? " Ha a szomszédos tagok különbsége mindig ugyanannyi, számtani sorozatról beszélünk." : ""}`;
        seq.showDiffs = true;
        diffToggle.setAttribute("aria-pressed", "true");
      } else {
        seqMessage.className = "il-message good";
        seqMessage.textContent = "Jó! Még egy tagot várunk.";
      }
    } else {
      seqMessage.className = "il-message warn";
      seqMessage.textContent = "Ez nem jó. Nézd meg, mi történik az egymás melletti tagok között: nő vagy csökken, és mennyivel, hányszorosára? (A különbségek gomb segít.)";
    }
    renderSequence();
  }

  function nextSequence() {
    seq.index = (seq.index + 1) % SEQUENCES.length;
    seq.known = SHOWN; seq.showDiffs = false; input.value = "";
    diffToggle.setAttribute("aria-pressed", "false");
    seqMessage.textContent = ""; seqMessage.className = "il-message";
    renderSequence();
  }

  root.append(figures, numbers, keyIdea("a sorozat szabálya megmondja, hogyan jön ki a következő tag az előzőkből. Ha ugyanannyival nő (vagy csökken) minden lépésben, a különbségek sora végig ugyanaz a szám."));
  renderTabs();
  drawFigures();
  renderSequence();
  return () => scope.clearAll();
}
