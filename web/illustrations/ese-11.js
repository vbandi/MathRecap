import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, slot, stepper, svg } from "./kit.js";

const LETTERS = "ABCDEFGH";
const WIDTH = 640, HEIGHT = 320;

export function mount(root) {
  const scope = createScope();
  let n = 6, edges = [[0, 1], [1, 2], [2, 3]], pending = null, flashing = [], flashTimer = null;

  root.append(lead("Egy csúcs fokszáma azt mondja meg, hány él indul ki belőle. Húzz éleket a csúcsok között, és figyeld a fokszámokat! Egy új él mindig két csúcsot érint, ebből következik valami meglepő a fokszámok összegéről."));

  const board = card("Húzz éleket: kattints két csúcsra egymás után");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Gráf a csúcsok fokszámával" });
  const sums = make("div", "il-formula start");
  const oddLine = make("div", "il-formula start");
  const message = make("p", "il-message");
  board.append(controls(
    stepper({ label: "Csúcsok száma", min: 3, max: 8, value: n, onChange: (value) => { n = value; edges = []; pending = null; render(); } }).element,
    button("Véletlen gráf", randomGraph), button("Élek törlése", () => { edges = []; pending = null; render(); }, { ghost: true }),
  ), figure, sums, oddLine, message);

  const challenge = card("Kihívás");
  const challengeText = make("p", "", "Próbálj meg olyan gráfot rajzolni, amelyben pontosan 1 (vagy 3, vagy 5) csúcs fokszáma páratlan! Kattints az ábrán, és nézd a páratlan fokú csúcsok számát.");
  const attempts = make("p", "il-message");
  challenge.append(challengeText, attempts);
  root.append(board, challenge, keyIdea("minden él két csúcs fokszámát növeli eggyel, ezért a fokszámok összege mindig az élek számának kétszerese. Ennek következménye, hogy páratlan fokú csúcs mindig páros sok van: a páratlan számok összege csak páros számú tagnál lehet páros."));

  const degree = (v) => edges.filter(([a, b]) => a === v || b === v).length;
  const points = () => Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: 320 + 120 * Math.cos(angle) * 1.5, y: 160 + 110 * Math.sin(angle) };
  });
  const hasEdge = (a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  function randomGraph() {
    edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.random() < 0.4) edges.push([i, j]);
    pending = null; flashing = [];
    render();
  }

  function pick(index) {
    if (pending === null) pending = index;
    else if (pending === index) pending = null;
    else {
      const a = pending, b = index;
      if (hasEdge(a, b)) edges = edges.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
      else edges.push([Math.min(a, b), Math.max(a, b)]);
      pending = null;
      flashing = [a, b];
      if (flashTimer !== null) scope.clearInterval(flashTimer);
      flashTimer = scope.timeout(() => { flashing = []; render(); }, 600);
    }
    render();
  }

  function render() {
    figure.replaceChildren();
    const pts = points();
    for (const [a, b] of edges) svg("line", { x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y, stroke: "var(--accent)", "stroke-width": 3, "stroke-linecap": "round" }, figure);
    pts.forEach((point, i) => {
      const odd = degree(i) % 2 === 1, hot = flashing.includes(i);
      const group = svg("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": `${LETTERS[i]} csúcs, fokszám ${degree(i)}` }, figure);
      svg("circle", { cx: point.x, cy: point.y, r: hot ? 24 : 20, fill: hot ? PALETTE.amber : pending === i ? PALETTE.amber : odd ? PALETTE.pink : PALETTE.blue, stroke: "var(--bg)", "stroke-width": 2 }, group);
      svg("text", { x: point.x, y: point.y + 6, "text-anchor": "middle", text: String(degree(i)), style: "fill:#fff;font-weight:700;font-size:18px" }, group);
      const dx = point.x >= 320 ? 34 : -34;
      svg("text", { x: point.x + (Math.abs(point.x - 320) < 5 ? 0 : dx), y: point.y + (Math.abs(point.x - 320) < 5 ? (point.y < 160 ? -30 : 38) : 5), "text-anchor": "middle", text: LETTERS[i], style: "fill:var(--dim);font-size:13px" }, group);
      group.addEventListener("click", () => pick(i));
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(i); } });
    });
    const degrees = Array.from({ length: n }, (_, i) => degree(i));
    const total = degrees.reduce((a, b) => a + b, 0);
    const oddCount = degrees.filter((d) => d % 2 === 1).length;
    sums.replaceChildren("fokszámok összege: ", slot(degrees.join(" + "), 32, { align: "left" }), " = ", make("b", "", String(total)), "  ·  2 · ", slot(String(edges.length), 3, { align: "left" }), " él = ", make("b", "", String(2 * edges.length)));
    oddLine.replaceChildren("páratlan fokú csúcsok (rózsaszín): ", make("b", "", String(oddCount)));
    message.textContent = pending !== null
      ? `${LETTERS[pending]} kijelölve: kattints egy másik csúcsra az él meghúzásához (ha már van él köztük, törlöd).`
      : flashing.length ? `Az új él két végén (${flashing.map((v) => LETTERS[v]).join(" és ")}) a fokszám 1-gyel nőtt, az összeg tehát 2-vel.`
        : "Kattints két csúcsra egymás után: él jön létre köztük, és mindkét végén nő a fokszám.";
    attempts.className = "il-message";
    attempts.textContent = oddCount % 2 === 1
      ? "Ez nem fordulhat elő, mert páratlan sok páratlan fokú csúcs nem létezik!"
      : `Most ${oddCount} csúcs páratlan fokú. Mindig páros szám lesz (0, 2, 4, …): hiába próbálkozol, egy vagy három nem jön ki.`;
  }

  render();
  return () => scope.clearAll();
}
