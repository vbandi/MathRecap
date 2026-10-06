import { button, card, controls, equation, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const COLORS = [PALETTE.blue, PALETTE.violet, PALETTE.pink, PALETTE.amber];

// Each piece is a polygon in unit coordinates plus the rigid motion that puts it into the new shape:
// a rotation by `angle` degrees around (cx, cy), followed by a translation (dx, dy).
const still = { dx: 0, dy: 0, cx: 0, cy: 0, angle: 0 };
const SHAPES = [
  {
    name: "Paralelogramma → téglalap", width: 8, height: 4,
    pieces: [
      { points: [[2, 0], [8, 0], [6, 4], [2, 4]], move: still },
      { points: [[0, 4], [2, 0], [2, 4]], move: { ...still, dx: 6 } },
    ],
    before: "Egy 6 egység alapú, 4 egység magas paralelogramma. A bal oldali háromszöget levágjuk...",
    after: "...és a jobb oldalra toljuk: téglalap lett, 6 egység széles és 4 magas. A terület ugyanannyi maradt.",
  },
  {
    name: "Háromszög → téglalap", width: 8, height: 4,
    pieces: [
      { points: [[1.5, 2], [5.5, 2], [8, 4], [0, 4]], move: still },
      { points: [[1.5, 2], [3, 0], [3, 2]], move: { ...still, cx: 1.5, cy: 2, angle: 180 } },
      { points: [[3, 0], [5.5, 2], [3, 2]], move: { ...still, cx: 5.5, cy: 2, angle: 180 } },
    ],
    before: "Egy 8 egység alapú, 4 egység magas háromszöget félmagasságban kettévágunk, a csúcsos részt pedig még függőlegesen is. A két kis háromszöget el kell forgatni...",
    after: "...fél fordulatot (180°) fordítva a megfelelő oldalfelező pont körül éppen befelé fordulnak. Téglalap lett: 8 széles és 2 magas.",
  },
  {
    name: "Lépcsős alakzat → téglalap", width: 5, height: 5,
    pieces: [
      { points: [[0, 5], [5, 5], [5, 2], [2, 2], [2, 3], [1, 3], [1, 4], [0, 4]], move: still },
      { points: [[4, 0], [5, 0], [5, 2], [4, 2]], move: { ...still, dx: -4, dy: 2 } },
      { points: [[3, 1], [4, 1], [4, 2], [3, 2]], move: { ...still, dx: -2, dy: 1 } },
    ],
    before: "Lépcső: az oszlopok 1, 2, 3, 4 és 5 négyzet magasak. A két legmagasabb oszlop tetejét lecsípjük...",
    after: "...és a két alacsony oszlopra tesszük. Mind az öt oszlop 3 magas lett: 5 · 3 = 15 négyzet. Ugyanannyi, mint az elején.",
    grid: true,
  },
];

const shoelace = (points) => Math.abs(points.reduce((sum, [x1, y1], i) => {
  const [x2, y2] = points[(i + 1) % points.length];
  return sum + x1 * y2 - x2 * y1;
}, 0)) / 2;

const transformOf = ({ dx, dy, cx, cy, angle }) => `translate(${dx + cx}px, ${dy + cy}px) rotate(${angle}deg) translate(${-cx}px, ${-cy}px)`;

export function mount(root) {
  const state = { shape: 0, moved: false };

  root.append(lead("Két alakzat területe akkor egyenlő, ha az egyikből szétvágott darabokat át lehet úgy rakni, hogy a másik alakzat jöjjön ki. Közben semmi nem vész el, és semmi nem keletkezik."));

  const main = card("Vágj, told, forgasd");
  const tabs = make("div", "il-controls");
  const tabButtons = SHAPES.map((shape, index) => toggle(shape.name, index === 0, () => { state.shape = index; state.moved = false; build(); }));
  tabs.append(...tabButtons);
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 270", role: "img", "aria-label": "Alakzat, amelyet darabokra vágunk és átrendezünk" });
  const moveButton = button("Átrendezés", () => { state.moved = !state.moved; render(); });
  const areaLine = make("div");
  const message = make("p", "il-message");
  main.append(tabs, figure, controls(moveButton), areaLine, message);
  root.append(main, keyIdea("ha egy síkidomot szétvágunk, majd a darabokat átrendezzük, a területe nem változik. Ezzel bonyolult alakzat területét egyszerűbb alakzatéra vezethetjük vissza."));

  let pieceElements = [];
  let scale = 50;

  function build() {
    const shape = SHAPES[state.shape];
    tabButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(index === state.shape)));
    figure.replaceChildren();
    scale = Math.min(520 / shape.width, 210 / shape.height);
    const group = svg("g", { transform: `translate(${(600 - shape.width * scale) / 2} 28) scale(${scale})` }, figure);
    if (shape.grid) {
      for (let i = 0; i <= shape.width; i++) svg("line", { x1: i, y1: 0, x2: i, y2: shape.height, class: "grid", "vector-effect": "non-scaling-stroke" }, group);
      for (let i = 0; i <= shape.height; i++) svg("line", { x1: 0, y1: i, x2: shape.width, y2: i, class: "grid", "vector-effect": "non-scaling-stroke" }, group);
    }
    pieceElements = shape.pieces.map((piece, index) => svg("polygon", {
      class: "il-move", points: piece.points.map(([x, y]) => `${x},${y}`).join(" "),
      style: `fill:${COLORS[index % COLORS.length]};fill-opacity:.8;stroke:var(--input);stroke-width:2.5`, "vector-effect": "non-scaling-stroke",
    }, group));
    render();
  }

  function render() {
    const shape = SHAPES[state.shape];
    shape.pieces.forEach((piece, index) => { pieceElements[index].style.transform = transformOf(state.moved ? piece.move : { ...piece.move, dx: 0, dy: 0, angle: 0 }); });
    const total = shape.pieces.reduce((sum, piece) => sum + shoelace(piece.points), 0);
    moveButton.textContent = state.moved ? "Vissza az eredetihez" : "Átrendezés";
    areaLine.replaceChildren(equation("Terület", slot(`${total} négyzetegység`, 18, { align: "left" })));
    message.textContent = state.moved ? shape.after : shape.before;
  }

  build();
  return () => {};
}
