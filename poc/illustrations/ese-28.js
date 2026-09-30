import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const SIZE = 340, MAX_DRAWN = 1500;

// A square with random points; `inside(u, v)` (0..1 coordinates) decides which points are hits.
function createSquareSim(parent, { label, drawRegion, inside }) {
  const view = make("div");
  view.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start";
  const left = make("div"), right = make("div");
  left.style.cssText = "flex:1 1 280px;max-width:360px";
  right.style.cssText = "flex:1 1 260px;min-width:0";
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", "aria-label": label });
  const regionLayer = svg("g", {}, figure), dotLayer = svg("g", {}, figure);
  let n = 0, hits = 0;
  const stats = make("div", "il-formula start");
  const countText = make("span"), hitText = make("span"), ratioText = make("span");
  stats.append(countText, make("br"), hitText, make("br"), ratioText);
  left.append(figure);
  right.append(stats);
  const throwMany = (times) => {
    for (let i = 0; i < times; i++) {
      const u = Math.random(), v = Math.random(), hit = inside(u, v);
      n += 1; if (hit) hits += 1;
      if (n <= MAX_DRAWN) svg("circle", { cx: u * SIZE, cy: (1 - v) * SIZE, r: 3, style: `fill:${hit ? PALETTE.green : PALETTE.red};opacity:.85` }, dotLayer);
    }
    sim.render();
  };
  const sim = {
    view, left, right,
    buttons: controls(button("1 dobás", () => throwMany(1)), button("10", () => throwMany(10)), button("100", () => throwMany(100)), button("1000", () => throwMany(1000)), button("Nullázás", () => sim.reset(), { ghost: true })),
    theoryText: make("span"),
    reset() { n = 0; hits = 0; dotLayer.replaceChildren(); regionLayer.replaceChildren(); drawRegion(regionLayer); sim.render(); },
    render() {
      countText.replaceChildren("dobások száma:   ", slot(String(n), 6, { align: "left" }));
      hitText.replaceChildren("találatok száma:  ", slot(String(hits), 6, { align: "left" }));
      ratioText.replaceChildren("találatok aránya: ", slot(n ? formatNumber(hits / n, 3) : "–", 6, { align: "left" }));
    },
  };
  right.append(sim.theoryText);
  view.append(left, right);
  parent.append(sim.buttons, view);
  return sim;
}

export function mount(root) {
  const scope = createScope();

  root.append(lead("Néha a kimenetelek nem megszámolható esetek, hanem egy síkidom vagy szakasz pontjai. Ilyenkor az esély arányos a nagysággal: ha egy pont véletlenül esik a négyzetbe, annak valószínűsége, hogy egy adott részbe esik, a rész területe osztva az egész területével."));

  // ---------------- Darts ----------------
  let radius = 0.3;
  const darts = card("Céltábla: dobálunk a négyzetbe");
  const radiusSlider = range({ label: "A kör sugara:", min: 0.05, max: 0.5, step: 0.05, value: radius, format: (v) => formatNumber(v, 2), onInput: (v) => { radius = v; dartSim.reset(); renderDartTheory(); } });
  darts.append(make("p", "", "A négyzet oldala 1 egység. A célkör a négyzet közepén van. Véletlenszerűen dobunk pontokat: a zöld pontok a körbe estek, a pirosak mellé."), controls(radiusSlider.element));
  const dartSim = createSquareSim(darts, {
    label: "Négyzet véletlen pontokkal és egy körrel",
    drawRegion: (layer) => svg("circle", { cx: SIZE / 2, cy: SIZE / 2, r: radius * SIZE, style: `fill:${PALETTE.blue};fill-opacity:.2;stroke:${PALETTE.blue};stroke-width:2.5` }, layer),
    inside: (u, v) => (u - 0.5) ** 2 + (v - 0.5) ** 2 <= radius ** 2,
  });
  const dartTheoryLine = make("div", "il-formula start");
  dartSim.theoryText.append(dartTheoryLine);
  function renderDartTheory() {
    const area = Math.PI * radius * radius;
    dartTheoryLine.replaceChildren("kör területe: π · ", slot(formatNumber(radius, 2), 5, { align: "left" }), "² = ", slot(formatNumber(area, 3), 6, { align: "left" }), make("br"), "négyzet területe: 1", make("br"), "P(találat) = ", slot(formatNumber(area, 3), 6, { align: "left" }));
  }

  // ---------------- Meeting problem ----------------
  let meetingWait = 15;
  const meeting = card("Találkozás: két barát 0 és 60 perc között érkezik");
  const windowSlider = range({ label: "Legfeljebb ennyit vár a másikra (perc):", min: 5, max: 30, step: 5, value: meetingWait, format: String, onInput: (v) => { meetingWait = v; meetSim.reset(); renderMeetTheory(); } });
  meeting.append(make("p", "", "Két barát találkozót beszélt meg egy óra alatti időpontra, de pontos időt nem. Mindketten véletlenül érkeznek 0 és 60 perc között, és ha a másik nincs ott, legfeljebb a megadott ideig várnak rá. A négyzet vízszintes tengelye az egyik, függőleges tengelye a másik barát érkezése. Találkoznak, ha az érkezések különbsége legfeljebb ennyi perc."), controls(windowSlider.element));
  const meetSim = createSquareSim(meeting, {
    label: "Az érkezési idők négyzete a találkozási sávval",
    drawRegion: (layer) => {
      const w = meetingWait / 60, s = SIZE, p = [[0, 0], [w, 0], [1, 1 - w], [1, 1], [1 - w, 1], [0, w]];
      svg("polygon", { points: p.map(([x, y]) => `${x * s},${(1 - y) * s}`).join(" "), style: `fill:${PALETTE.green};fill-opacity:.2;stroke:${PALETTE.green};stroke-width:2` }, layer);
      [0, 15, 30, 45, 60].forEach((m) => {
        svg("text", { x: (m / 60) * s, y: s - 4, "text-anchor": m === 0 ? "start" : m === 60 ? "end" : "middle", text: String(m), style: "font-size:11px;fill:var(--dim)" }, layer);
        if (m) svg("text", { x: 4, y: (1 - m / 60) * s + 4, text: String(m), style: "font-size:11px;fill:var(--dim)" }, layer);
      });
    },
    inside: (u, v) => Math.abs(u - v) <= meetingWait / 60,
  });
  const meetTheoryLine = make("div", "il-formula start");
  meetSim.theoryText.append(meetTheoryLine);
  function renderMeetTheory() {
    const w = meetingWait / 60, miss = (1 - w) ** 2;
    meetTheoryLine.replaceChildren("a nem találkozás két derékszögű háromszög:", make("br"), `mindkettő ${60 - meetingWait} · ${60 - meetingWait} / 2`, make("br"), `együtt ${60 - meetingWait}² = ${(60 - meetingWait) ** 2} (a 60² = 3600-ból)`, make("br"),
      "P(találkoznak) = 1 − ", slot(`${(60 - meetingWait) ** 2}/3600`, 10, { align: "left" }), make("br"), "               = ", slot(formatNumber(1 - miss, 4), 7, { align: "left" }));
  }

  root.append(darts, meeting, keyIdea("geometriai valószínűség: P = kedvező rész mérete / az egész mérete (terület, hosszúság vagy térfogat). Sok véletlen pontnál a találatok aránya egyre jobban megközelíti ezt a hányadost."));
  dartSim.reset(); renderDartTheory();
  meetSim.reset(); renderMeetTheory();
  return () => scope.clearAll();
}
