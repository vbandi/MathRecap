import { button, card, controls, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const LETTERS = "ABCDEFGH";
const WIDTH = 640, HEIGHT = 320, RADIUS = 17, MAX_VERTICES = 8;

export function mount(root) {
  let vertices = [
    { x: 150, y: 90 }, { x: 330, y: 60 }, { x: 500, y: 130 }, { x: 290, y: 240 },
  ];
  let edges = [[0, 1], [1, 2], [2, 3]];
  let pending = null, complete = false, dragging = null, suppressClick = false;

  root.append(lead("A gráf pontokból és a köztük húzott vonalakból áll. A pontokat csúcsoknak, a vonalakat éleknek hívjuk. Így le lehet rajzolni, hogy mi mivel áll kapcsolatban: kik ismerik egymást, mely városokat köt össze út. Építs saját gráfot!"));

  const board = card("Rajzolj gráfot");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Gráf rajzolása" });
  figure.style.cssText = "touch-action:none;cursor:crosshair";
  const edgeLayer = svg("g", {}, figure), vertexLayer = svg("g", {}, figure);
  const buttons = make("div", "il-controls");
  const completeToggle = toggle("Teljes gráf", false, () => { complete = !complete; if (complete) connectAll(); render(); });
  buttons.append(
    completeToggle,
    button("Utolsó csúcs törlése", () => { if (vertices.length) removeVertex(vertices.length - 1); }, { ghost: true }),
    button("Mindent töröl", () => { vertices = []; edges = []; pending = null; complete = false; render(); }, { ghost: true }),
  );
  const counts = make("div", "il-formula start");
  const edgeList = make("p", "il-muted");
  const message = make("p", "il-message");
  board.append(buttons, figure, counts, edgeList, message);
  root.append(board, keyIdea("a gráfot a csúcsok és az élek adják meg; az, hogy hova rajzoljuk a pontokat, nem számít. Ha n csúcs között minden lehetséges él be van húzva (teljes gráf), az élek száma n · (n − 1) / 2."));

  const hasEdge = (a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  function connectAll() {
    edges = [];
    for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) edges.push([i, j]);
  }
  function removeVertex(index) {
    vertices.splice(index, 1);
    edges = edges.filter(([a, b]) => a !== index && b !== index).map(([a, b]) => [a > index ? a - 1 : a, b > index ? b - 1 : b]);
    pending = null;
    render();
  }
  function toggleEdge(a, b) {
    if (hasEdge(a, b)) { edges = edges.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a))); complete = false; }
    else edges.push([Math.min(a, b), Math.max(a, b)]);
  }
  const toPoint = (event) => {
    const box = figure.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * WIDTH, y: ((event.clientY - box.top) / box.height) * HEIGHT };
  };

  figure.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    const target = event.target.closest("[data-vertex]");
    if (!target) return;
    suppressClick = true;
    dragging = { index: Number(target.dataset.vertex), moved: false, start: toPoint(event) };
    figure.setPointerCapture(event.pointerId);
  });
  figure.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const point = toPoint(event);
    if (Math.hypot(point.x - dragging.start.x, point.y - dragging.start.y) > 4) dragging.moved = true;
    if (dragging.moved) {
      vertices[dragging.index] = { x: Math.min(WIDTH - RADIUS, Math.max(RADIUS, point.x)), y: Math.min(HEIGHT - RADIUS, Math.max(RADIUS, point.y)) };
      render();
    }
  });
  figure.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    const { index, moved } = dragging;
    dragging = null;
    if (moved) return;
    if (pending === null) pending = index;
    else if (pending === index) pending = null;
    else { toggleEdge(pending, index); pending = null; }
    render();
  });
  figure.addEventListener("click", (event) => {
    if (suppressClick || event.target.closest("[data-vertex]")) { suppressClick = false; return; }
    const point = toPoint(event);
    if (pending !== null) { pending = null; render(); return; }
    if (vertices.length >= MAX_VERTICES) { message.textContent = `Legfeljebb ${MAX_VERTICES} csúcsot lehet rajzolni.`; return; }
    if (vertices.some((v) => Math.hypot(v.x - point.x, v.y - point.y) < RADIUS * 2.2)) return;
    vertices.push({ x: Math.min(WIDTH - RADIUS, Math.max(RADIUS, point.x)), y: Math.min(HEIGHT - RADIUS, Math.max(RADIUS, point.y)) });
    if (complete) connectAll();
    render();
  });

  function render() {
    edgeLayer.replaceChildren(); vertexLayer.replaceChildren();
    for (const [a, b] of edges) svg("line", { x1: vertices[a].x, y1: vertices[a].y, x2: vertices[b].x, y2: vertices[b].y, stroke: "var(--accent)", "stroke-width": 3, "stroke-linecap": "round" }, edgeLayer);
    vertices.forEach((vertex, index) => {
      const group = svg("g", { "data-vertex": index, style: "cursor:pointer" }, vertexLayer);
      svg("circle", { cx: vertex.x, cy: vertex.y, r: RADIUS, fill: pending === index ? PALETTE.amber : PALETTE.blue, stroke: "var(--bg)", "stroke-width": 2 }, group);
      svg("text", { x: vertex.x, y: vertex.y + 5, "text-anchor": "middle", text: LETTERS[index], style: "fill:#fff;font-weight:700;font-size:14px" }, group);
    });
    completeToggle.setAttribute("aria-pressed", String(complete));
    const n = vertices.length, most = (n * (n - 1)) / 2;
    counts.replaceChildren("csúcsok: ", slot(String(n), 2, { align: "left" }), " élek: ", slot(String(edges.length), 3, { align: "left" }), "legfeljebb ", slot(n > 1 ? `${n} · ${n - 1} / 2 = ${most}` : "0", 14, { align: "left" }), " él lehetne");
    edgeList.textContent = `Élek: ${edges.length ? edges.map(([a, b]) => LETTERS[a] + LETTERS[b]).join(", ") : "még nincs"}`;
    message.className = "il-message";
    message.textContent = pending !== null
      ? `${LETTERS[pending]} csúcs kijelölve: kattints egy másik csúcsra, és összekötjük őket (ha már össze vannak kötve, az élt töröljük).`
      : n === 0 ? "Kattints az ábrára: ott új csúcs jelenik meg."
        : edges.length === most && n > 1 ? `Ez egy teljes gráf: minden csúcspár össze van kötve, ${n} csúcsnál ${most} él van.`
          : "Üres helyre kattintva új csúcs lesz; két csúcsra egymás után kattintva él; a csúcsokat el is húzhatod.";
  }

  render();
  return () => {};
}
