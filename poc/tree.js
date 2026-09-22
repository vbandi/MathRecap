"use strict";

import { cacheUsefulness, calibrationProposal, loadLocalState, recomputeLocks, saveLocalState, setManualMastery, undoCalibrationProposal, updateProfileAndModel, usefulnessDisplayState } from "./state.js";

const BRANCHES = {
  LOG: { name: "Logika", color: "#6C5CE7", darkText: false },
  SZA: { name: "Számok", color: "#0B84D6", darkText: false },
  ALG: { name: "Algebra", color: "#00A085", darkText: false },
  FUG: { name: "Függvények", color: "#E8A33D", darkText: true },
  GEO: { name: "Geometria", color: "#D94F45", darkText: false },
  ESE: { name: "Esély", color: "#C2559E", darkText: false },
};
const BRANCH_ORDER = ["LOG", "SZA", "ALG", "FUG", "GEO", "ESE"];

const MASTERY_LEVEL_NAMES = ["nem ismerem", "hallottam róla", "értem", "megy", "biztos tudom"];
const MASTERY_LEVEL_DESCRIPTIONS = [
  "nem tudom, mi ez",
  "rémlik, de nem tudnám elmagyarázni",
  "el tudom magyarázni, de feladatnál elakadok",
  "megoldom, ha van rá időm",
  "dolgozatban is menne, segítség nélkül",
];

const NW = 176, NH = 64;          // csomópont
const SLOT_W = 204, SLOT_H = 124; // rács
const AG_GAP = 72;
const BRANCH_HEADER_HEIGHT = 54;            // hely az ágfeliratnak
const LABEL_THRESHOLD = 0.5;         // az egyetlen zoom-küszöb

// ---------------------------------------------------------------- adatok

const nodes = window.TREE_NODES;
const byId = new Map(nodes.map((n) => [n.id, n]));

for (const n of nodes) {
  n.descendants = [];
  n.mastery = 0;
  n.locked = false;
}
for (const n of nodes) {
  for (const p of n.prerequisites) byId.get(p).descendants.push(n.id);
}

// Réteg = leghosszabb út a gyökerektől; egyben topologikus order.
const topoSorrend = (function () {
  const bejovo = new Map(nodes.map((n) => [n.id, n.prerequisites.length]));
  const row = nodes.filter((n) => n.prerequisites.length === 0).map((n) => n.id);
  const out = [];
  for (const n of nodes) n.layer = 0;
  while (row.length) {
    const id = row.shift();
    out.push(id);
    for (const u of byId.get(id).descendants) {
      const un = byId.get(u);
      un.layer = Math.max(un.layer, byId.get(id).layer + 1);
      const maradek = bejovo.get(u) - 1;
      bejovo.set(u, maradek);
      if (maradek === 0) row.push(u);
    }
  }
  if (out.length !== nodes.length) console.warn("Kör a gráfban!");
  return out;
})();

const MAX_RETEG = Math.max(...nodes.map((n) => n.layer));

// ---------------------------------------------------------------- elrendezés

let worldWidth = 0;
const worldHeight = (MAX_RETEG + 1) * SLOT_H + BRANCH_HEADER_HEIGHT + 40;
const bands = [];

(function layout() {
  let x = 0;
  for (const branch of BRANCH_ORDER) {
    const members = nodes.filter((n) => n.branch === branch);
    const rows = [];
    for (const n of members) (rows[n.layer] ??= []).push(n);

    // Barycenter-simítás: a csomópont az előzményei/utódai átlagos oszlopa köré kerül.
    const column = new Map(members.map((n) => [n.id, 0]));
    const recalculate = () => {
      for (const row of rows) if (row) row.forEach((n, i) => column.set(n.id, i));
    };
    recalculate();
    const average = (n, field) => {
      const relevans = n[field].filter((id) => column.has(id));
      if (!relevans.length) return column.get(n.id);
      return relevans.reduce((a, id) => a + column.get(id), 0) / relevans.length;
    };
    for (let pass = 0; pass < 4; pass++) {
      const downward = pass % 2 === 0;
      const indices = [...rows.keys()];
      for (const r of downward ? indices : indices.reverse()) {
        if (!rows[r]) continue;
        rows[r].sort((a, b) => average(a, downward ? "prerequisites" : "descendants") - average(b, downward ? "prerequisites" : "descendants"));
        recalculate();
      }
    }

    const width = Math.max(...rows.filter(Boolean).map((s) => s.length));
    for (const row of rows) {
      if (!row) continue;
      const offset = ((width - row.length) / 2) * SLOT_W;
      row.forEach((n, i) => {
        n.x = x + offset + i * SLOT_W + SLOT_W / 2;
        n.y = BRANCH_HEADER_HEIGHT + n.layer * SLOT_H + SLOT_H / 2;
      });
    }

    bands.push({ branch, x, w: width * SLOT_W });
    x += width * SLOT_W + AG_GAP;
  }
  worldWidth = x - AG_GAP;
})();

const edges = [];
for (const n of nodes) {
  for (const p of n.prerequisites) {
    edges.push({ from: byId.get(p), to: n, crossBranch: byId.get(p).branch !== n.branch });
  }
}

// ---------------------------------------------------------------- kezdőállapot

const skillIds = nodes.map((node) => node.id);
let localState = loadLocalState(window.localStorage, skillIds);

function persistLocalState() {
  localState = saveLocalState(window.localStorage, localState, skillIds);
}

function refreshLocks() {
  const locks = recomputeLocks(nodes, localState.mastery);
  for (const n of nodes) {
    n.mastery = localState.mastery[n.id];
    n.locked = locks[n.id];
  }
}
persistLocalState();
refreshLocks();

// ---------------------------------------------------------------- vászon

const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const mm = document.getElementById("minimap");
const mmx = mm.getContext("2d");
const tip = document.getElementById("tip");
const panel = document.getElementById("panel");
const panelBody = document.getElementById("panel-body");

let view = { x: 0, y: 0, z: 1 };
let dpr = 1, W = 0, H = 0;
let hover = null, selected = null;
let usefulnessFallbackSkillId = null;
let usefulnessRefreshFailedSkillId = null;
let onlyGateways = false;
let matches = new Set();
let highlightedAncestors = new Set(), highlightedDescendants = new Set();
const VISIBILITY_FADE_MS = 150;
let visibilityFade = null;
let visibilityAnimationFrame = null;

let initialMeasure = true;
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = cv.clientWidth;
  H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  // A vászon 0×0-ként is betöltődhet (rejtett fül); az első valódi mérésnél illesztünk.
  if (initialMeasure) { initialMeasure = false; initialView(); }
  else draw();
}
new ResizeObserver(resize).observe(cv);

function fitToScreen() {
  if (!W || !H) return;
  const pad = 60;
  const z = Math.min((W - pad * 2) / worldWidth, (H - pad * 2) / worldHeight);
  view.z = z;
  view.x = (W - worldWidth * z) / 2;
  view.y = (H - worldHeight * z) / 2;
  draw();
}

// A teljes fa áttekintő zoomon olvashatatlan; induláskor ezért a címkeküszöb fölött kezdünk.
function initialView() {
  if (!W || !H) return;
  view.z = 0.58;
  view.x = W / 2 - (worldWidth / 2) * view.z;
  view.y = 24;
  draw();
}

// ---------------------------------------------------------------- rajzolás

function branchColorRgba(branch, a) {
  const h = BRANCHES[branch].color;
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rrect(c, x, y, w, h, r) {
  if (c.roundRect) { c.beginPath(); c.roundRect(x, y, w, h, r); return; }
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

const sorokCache = new Map();
function nameLines(n) {
  if (sorokCache.has(n.id)) return sorokCache.get(n.id);
  ctx.font = "12.5px 'Segoe UI', system-ui, sans-serif";
  const max = NW - 20;
  const szavak = n.name.split(" ");
  const rows = [];
  let akt = "";
  for (const sz of szavak) {
    const proba = akt ? akt + " " + sz : sz;
    if (ctx.measureText(proba).width > max && akt) { rows.push(akt); akt = sz; }
    else akt = proba;
    if (rows.length === 2) break;
  }
  if (rows.length < 2 && akt) rows.push(akt);
  if (rows.length === 2 && ctx.measureText(rows[1]).width > max - 10) {
    while (rows[1].length > 4 && ctx.measureText(rows[1] + "…").width > max) rows[1] = rows[1].slice(0, -1);
    rows[1] += "…";
  }
  sorokCache.set(n.id, rows);
  return rows;
}

function visibility(n) {
  if (highlightedAncestors.size || highlightedDescendants.size) {
    const benne = n === hover || n === selected || highlightedAncestors.has(n.id) || highlightedDescendants.has(n.id);
    if (!benne) return 0.4;
  }
  if (matches.size && !matches.has(n.id)) return 0.15;
  if (onlyGateways && !n.gateway) return 0.08;
  return 1;
}

function displayedVisibility(n) {
  if (!visibilityFade) return visibility(n);
  const progress = Math.min(1, (performance.now() - visibilityFade.startedAt) / VISIBILITY_FADE_MS);
  const from = visibilityFade.from.get(n.id);
  const to = visibilityFade.to.get(n.id);
  return from + (to - from) * progress;
}

function requestVisibilityDraw() {
  if (visibilityAnimationFrame !== null) return;
  visibilityAnimationFrame = requestAnimationFrame(() => {
    visibilityAnimationFrame = null;
    draw();
  });
}

function beginVisibilityFade(from) {
  visibilityFade = {
    startedAt: performance.now(),
    from,
    to: new Map(nodes.map((n) => [n.id, visibility(n)])),
  };
  requestVisibilityDraw();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.z, view.z);

  // ágsávok
  for (const s of bands) {
    ctx.fillStyle = branchColorRgba(s.branch, 0.035);
    ctx.fillRect(s.x, 0, s.w, worldHeight);
    ctx.fillStyle = branchColorRgba(s.branch, 0.55);
    ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(BRANCHES[s.branch].name.toUpperCase(), s.x + s.w / 2, 34);
  }
  ctx.textAlign = "left";

  // élek
  for (const e of edges) {
    const a = Math.min(displayedVisibility(e.from), displayedVisibility(e.to));
    let color = `rgba(150,160,180,${0.3 * a})`, vastag = 1.2;
    const kiemelt = (highlightedAncestors.has(e.from.id) || e.from === hover || e.from === selected) &&
                    (highlightedAncestors.has(e.to.id) || e.to === hover || e.to === selected);
    const utodEl = (highlightedDescendants.has(e.to.id)) &&
                   (highlightedDescendants.has(e.from.id) || e.from === hover || e.from === selected);
    if (kiemelt) { color = "rgba(120,170,255,.9)"; vastag = 2; }
    else if (utodEl) { color = "rgba(232,163,61,.85)"; vastag = 2; }

    ctx.strokeStyle = color;
    ctx.lineWidth = vastag;
    ctx.setLineDash(e.crossBranch ? [6, 5] : []);
    const y1 = e.from.y + NH / 2, y2 = e.to.y - NH / 2;
    const k = Math.min(60, Math.max(24, (y2 - y1) / 2));
    ctx.beginPath();
    ctx.moveTo(e.from.x, y1);
    ctx.bezierCurveTo(e.from.x, y1 + k, e.to.x, y2 - k, e.to.x, y2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // csomópontok
  const labels = view.z >= LABEL_THRESHOLD;
  for (const n of nodes) {
    const a = displayedVisibility(n);
    if (a < 0.02) continue;
    ctx.globalAlpha = a;
    const x = n.x - NW / 2, y = n.y - NH / 2;
    const info = BRANCHES[n.branch];

    if (n.locked) {
      rrect(ctx, x, y, NW, NH, 8);
      ctx.fillStyle = "#14161c";
      ctx.fill();
      ctx.strokeStyle = "#333a48";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      rrect(ctx, x, y, NW, NH, 8);
      ctx.fillStyle = n.mastery === 0 ? "#181b23" : branchColorRgba(n.branch, 0.14 + (n.mastery / 4) * 0.86);
      ctx.fill();
      ctx.strokeStyle = info.color;
      ctx.lineWidth = n.gateway ? 2.6 : 1.4;
      ctx.stroke();
    }
    if (matches.has(n.id)) {
      rrect(ctx, x - 4, y - 4, NW + 8, NH + 8, 11);
      ctx.strokeStyle = "#ffd479";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (n === selected) {
      rrect(ctx, x - 5, y - 5, NW + 10, NH + 10, 12);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const filled = !n.locked && n.mastery >= 3;
    const primary = n.locked ? "#5d6579" : filled ? (info.darkText ? "#2B2B2B" : "#ffffff") : "#ced4e2";
    const muted = n.locked ? "#4b5266" : filled ? (info.darkText ? "rgba(43,43,43,.65)" : "rgba(255,255,255,.7)") : "#818aa0";

    if (labels) {
      ctx.font = "10.5px ui-monospace, Consolas, monospace";
      ctx.fillStyle = muted;
      ctx.fillText(n.id, x + 10, y + 16);
      if (n.gateway) {
        ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText("★", x + NW - 20, y + 16);
      }
      ctx.font = "12.5px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = primary;
      nameLines(n).forEach((s, i) => ctx.fillText(s, x + 10, y + 34 + i * 15));
    } else if (n.gateway) {
      // Képernyőméretben rögzített felirat, hogy távolról is legyen tájékozódási pont.
      const f = 11 / view.z;
      ctx.font = `600 ${f}px ui-monospace, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3.5 / view.z;
      ctx.strokeStyle = "rgba(8,10,14,.85)";
      ctx.strokeText(n.id, n.x, n.y + NH / 2 + f * 1.15);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.fillText(n.id, n.x, n.y + NH / 2 + f * 1.15);
      ctx.textAlign = "left";
    }

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i <= n.mastery ? (filled ? muted : info.color) : "rgba(255,255,255,.13)";
      ctx.fillRect(x + 10 + i * 9, y + NH - 12, 6, 5);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  drawMinimap();
  if (visibilityFade) {
    if (performance.now() - visibilityFade.startedAt >= VISIBILITY_FADE_MS) visibilityFade = null;
    else requestVisibilityDraw();
  }
}

function drawMinimap() {
  const s = Math.min(mm.width / worldWidth, mm.height / worldHeight);
  const ox = (mm.width - worldWidth * s) / 2, oy = (mm.height - worldHeight * s) / 2;
  mmx.clearRect(0, 0, mm.width, mm.height);
  for (const n of nodes) {
    mmx.fillStyle = n.locked ? "rgba(90,98,120,.5)" : branchColorRgba(n.branch, 0.35 + (n.mastery / 4) * 0.65);
    mmx.fillRect(ox + (n.x - NW / 2) * s, oy + (n.y - NH / 2) * s, Math.max(2, NW * s), Math.max(2, NH * s));
  }
  mmx.strokeStyle = "rgba(255,255,255,.8)";
  mmx.lineWidth = 1.5;
  mmx.strokeRect(ox + (-view.x / view.z) * s, oy + (-view.y / view.z) * s, (W / view.z) * s, (H / view.z) * s);
  mm._s = s; mm._ox = ox; mm._oy = oy;
}

// ---------------------------------------------------------------- interakció

function screenToWorld(sx, sy) {
  return { x: (sx - view.x) / view.z, y: (sy - view.y) / view.z };
}
function findNode(sx, sy) {
  const p = screenToWorld(sx, sy);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (onlyGateways && !n.gateway) continue;
    if (Math.abs(p.x - n.x) <= NW / 2 && Math.abs(p.y - n.y) <= NH / 2) return n;
  }
  return null;
}

let drag = null, moved = false;
cv.addEventListener("pointerdown", (e) => {
  drag = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  moved = false;
  cv.setPointerCapture(e.pointerId);
  cv.classList.add("dragging");
});
cv.addEventListener("pointermove", (e) => {
  const r = cv.getBoundingClientRect();
  if (drag) {
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    view.x = drag.vx + dx;
    view.y = drag.vy + dy;
    draw();
    return;
  }
  const n = findNode(e.clientX - r.left, e.clientY - r.top);
  if (n !== hover) {
    hover = n;
    if (!selected) refreshHighlight(n);
    draw();
  }
  if (n) {
    tip.style.display = "block";
    tip.style.left = Math.min(e.clientX - r.left + 14, W - 280) + "px";
    tip.style.top = e.clientY - r.top + 66 + "px";
    tip.innerHTML = `<b>${n.id}</b> · ${esc(n.name)}<br><span class="t">${
      n.locked ? "zárolt — hiányzik: " + n.prerequisites.filter((p) => byId.get(p).mastery < 2).join(", ")
               : MASTERY_LEVEL_NAMES[n.mastery] + " · " + n.descendants.length + " készséget nyit meg"}</span>`;
  } else {
    tip.style.display = "none";
  }
});
cv.addEventListener("pointerleave", () => {
  tip.style.display = "none";
  if (hover && !selected) { hover = null; refreshHighlight(null); draw(); }
});
cv.addEventListener("pointerup", (e) => {
  cv.classList.remove("dragging");
  const dragStart = drag;
  drag = null;
  if (moved || !dragStart) return;
  const r = cv.getBoundingClientRect();
  const n = findNode(e.clientX - r.left, e.clientY - r.top);
  n ? selectNode(n) : closePanel();
});
cv.addEventListener("dblclick", (e) => {
  const r = cv.getBoundingClientRect();
  const n = findNode(e.clientX - r.left, e.clientY - r.top);
  if (n) flyTo(n, 1.1);
});
cv.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const previous = screenToWorld(sx, sy);
  const nextZoom = Math.min(2.2, Math.max(0.1, view.z * Math.pow(1.0015, -e.deltaY)));
  view.z = nextZoom;
  view.x = sx - previous.x * nextZoom;
  view.y = sy - previous.y * nextZoom;
  draw();
}, { passive: false });

let minimapDrag = false;
function moveCameraFromMinimap(e) {
  const r = mm.getBoundingClientRect();
  const wx = ((e.clientX - r.left) * (mm.width / r.width) - mm._ox) / mm._s;
  const wy = ((e.clientY - r.top) * (mm.height / r.height) - mm._oy) / mm._s;
  view.x = W / 2 - wx * view.z;
  view.y = H / 2 - wy * view.z;
  draw();
}
mm.addEventListener("pointerdown", (e) => {
  minimapDrag = true;
  mm.setPointerCapture(e.pointerId);
  moveCameraFromMinimap(e);
});
mm.addEventListener("pointermove", (e) => {
  if (minimapDrag) moveCameraFromMinimap(e);
});
mm.addEventListener("pointerup", (e) => {
  minimapDrag = false;
  mm.releasePointerCapture(e.pointerId);
});
mm.addEventListener("pointercancel", () => {
  minimapDrag = false;
});

function flyTo(n, z = 1.1) {
  const target = { z, x: W / 2 - n.x * z, y: H / 2 - n.y * z };
  const start = { ...view }, t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 380);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    view.x = start.x + (target.x - start.x) * e;
    view.y = start.y + (target.y - start.y) * e;
    view.z = start.z + (target.z - start.z) * e;
    draw();
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

function traverse(n, field) {
  const ki = new Set(), row = [...n[field]];
  while (row.length) {
    const id = row.pop();
    if (ki.has(id)) continue;
    ki.add(id);
    row.push(...byId.get(id)[field]);
  }
  return ki;
}
function refreshHighlight(n) {
  const from = new Map(nodes.map((node) => [node.id, displayedVisibility(node)]));
  highlightedAncestors = n ? traverse(n, "prerequisites") : new Set();
  highlightedDescendants = n ? traverse(n, "descendants") : new Set();
  beginVisibilityFade(from);
}

// ---------------------------------------------------------------- panel

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function masteryIndicators(sz, branch) {
  return `<span class="masteryIndicators">${[0, 1, 2, 3, 4]
    .map((i) => `<i style="background:${i <= sz ? BRANCHES[branch].color : "#2c313d"}"></i>`).join("")}</span>`;
}
function dependencyRow(id) {
  const n = byId.get(id);
  return `<div class="dep" data-goto="${n.id}">${masteryIndicators(n.locked ? -1 : n.mastery, n.branch)}
    <span class="nm">${esc(n.name)}</span> <span class="id">${n.id}</span></div>`;
}

function selectNode(n) {
  selected = n;
  refreshHighlight(n);
  renderPanel();
  panel.classList.add("open");
  draw();
}
function closePanel() {
  selected = null;
  refreshHighlight(hover);
  panel.classList.remove("open");
  draw();
}
function resetTree() {
  hover = null;
  selected = null;
  matches = new Set();
  search.value = "";
  search.blur();
  tip.style.display = "none";
  refreshHighlight(null);
  panel.classList.remove("open");
  draw();
}

function renderPanel() {
  const n = selected;
  if (!n) return;
  const missing = n.prerequisites.filter((p) => byId.get(p).locked || byId.get(p).mastery < 2);
  const usefulnessState = usefulnessDisplayState(localState, n.id, usefulnessRefreshFailedSkillId === n.id);
  const usefulness = usefulnessState.text
    ? `<div class="usefulness-text">${esc(usefulnessState.text)}</div>${usefulnessState.refreshFailed ? '<div class="usefulness-error" role="alert">Nem sikerült frissíteni az indoklást. <button class="text-button" data-act="usefulness-retry">Próbáld újra</button></div>' : ""}<button class="text-button" data-act="usefulness">Mást kérek</button>`
    : usefulnessFallbackSkillId === n.id
      ? `<div class="usefulness-error" role="alert">Most nem sikerült valós példát készíteni ehhez a készséghez. <button class="text-button" data-act="usefulness-retry">Próbáld újra</button></div>`
    : `<em>${localState.selectedModel ? "Kérhetsz rövid, személyre szabott indoklást." : "Állíts be egy modellt a személyre szabott indokláshoz."}</em><button class="text-button" data-act="usefulness" ${localState.selectedModel ? "" : "disabled"}>Miért jó nekem?</button>`;
  panelBody.innerHTML = `
    <h2>${esc(n.name)}</h2>
    <div class="sub"><span style="color:${BRANCHES[n.branch].color}">●</span> ${BRANCHES[n.branch].name} ága ·
      <code>${n.id}</code> · ${n.layer + 1}. réteg${n.gateway ? " · ★ kapunode" : ""}</div>

    ${n.locked ? `<div class="locked">Zárolt — előbb ezek kellenek legalább 2. szinten:
        ${missing.map((h) => `<b>${h}</b>`).join(", ")}</div>` : ""}

    <div class="block"><div class="lbl">Mi ez</div>${esc(n.description)}</div>

    <div class="block ai"><div class="lbl">Miért jó neked</div>${usefulness}</div>

    <div class="block"><div class="lbl">Előfeltételek (${n.prerequisites.length})</div>
      ${n.prerequisites.length ? n.prerequisites.map(dependencyRow).join("") : '<span class="sub">nincs — kiindulópont</span>'}</div>

    <div class="block"><div class="lbl">Ezt nyitja meg (${n.descendants.length})</div>
      ${n.descendants.length ? n.descendants.map(dependencyRow).join("") : '<span class="sub">a lánc vége</span>'}</div>

    <div class="block"><div class="lbl">Mennyire tudod?</div>
      <div class="slider">${[0, 1, 2, 3, 4]
        .map((i) => `<button data-lvl="${i}" class="${n.mastery === i ? "on" : ""}">${i}</button>`).join("")}</div>
      <div class="lvltext"><b>${MASTERY_LEVEL_NAMES[n.mastery]}</b> · „${MASTERY_LEVEL_DESCRIPTIONS[n.mastery]}"</div></div>

    <div class="actions">
      <button data-act="path">Ezt akarom tanulni</button>
      <button class="ghost" data-act="gyak">Gyakorlás →</button>
    </div>`;
}

panelBody.addEventListener("click", (e) => {
  const dep = e.target.closest("[data-goto]");
  if (dep) { const n = byId.get(dep.dataset.goto); selectNode(n); flyTo(n); return; }
  const lvl = e.target.closest("[data-lvl]");
  if (lvl) {
    localState = setManualMastery(localState, skillIds, selected.id, +lvl.dataset.lvl);
    localState = saveLocalState(window.localStorage, localState, skillIds);
    refreshLocks();
    renderPanel();
    draw();
    return;
  }
  const act = e.target.closest("[data-act]");
  if (act?.dataset.act === "path") learningPath(selected);
  if (act?.dataset.act === "gyak") window.location.assign(`worksheet.html?skill=${encodeURIComponent(selected.id)}`);
  if (act?.dataset.act === "usefulness" || act?.dataset.act === "usefulness-retry") generateUsefulness(selected);
});

async function generateUsefulness(skill) {
  if (!localState.selectedModel) return;
  usefulnessFallbackSkillId = null;
  usefulnessRefreshFailedSkillId = null;
  panelBody.querySelector(".ai").innerHTML = `<div class="lbl">Miért jó neked</div><em>Indoklás készül…</em>`;
  try {
    const response = await fetch("/api/usefulness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: localState.selectedModel,
        profile: localState.profile,
        skill: { id: skill.id, name: skill.name, description: skill.description, prerequisites: skill.prerequisites, relatedSkillIds: skill.descendants },
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Az indoklás most nem érhető el.");
    localState = cacheUsefulness(localState, skill.id, payload.usefulness.text);
    persistLocalState();
  } catch {
    if (usefulnessDisplayState(localState, skill.id).text) usefulnessRefreshFailedSkillId = skill.id;
    else usefulnessFallbackSkillId = skill.id;
  }
  if (selected?.id === skill.id) renderPanel();
}
panel.querySelector(".close").addEventListener("click", closePanel);

function learningPath(n) {
  const required = [...traverse(n, "prerequisites")].map(byId.get.bind(byId)).filter((x) => x.mastery < 2);
  matches = new Set([n.id, ...required.map((x) => x.id)]);
  highlightedAncestors = new Set(); highlightedDescendants = new Set();
  const order = topoSorrend.filter((id) => matches.has(id) && id !== n.id);
  showPersistentTip(`<b>${n.id}</b> · ${required.length} készség hiányzik<br><span class="t">${
    order.slice(0, 12).map((id) => esc(byId.get(id).name)).join(" → ")}</span>`);
  draw();
}
function showPersistentTip(html) {
  tip.innerHTML = html;
  tip.style.display = "block";
  tip.style.left = "12px";
  tip.style.top = "12px";
}

// ---------------------------------------------------------------- onboarding és beállítások

const ONBOARDING_SKILL_IDS = ["SZA-24", "ALG-13", "GEO-36", "FUG-10", "ESE-25", "LOG-14", "ALG-24", "GEO-40", "FUG-16", "SZA-33", "GEO-54", "ESE-19"];
const onboardingDialog = document.getElementById("onboarding-dialog");
const onboardingBody = document.getElementById("onboarding-body");
const settingsDialog = document.getElementById("settings-dialog");
const settingsBody = document.getElementById("settings-body");
let onboarding = null;
let modelCatalog = [];
let modelCatalogMessage = "";
let modelSearchQuery = "";

function matchingModels(query) {
  const normalizedQuery = query.trim().toLocaleLowerCase("hu");
  if (!normalizedQuery) return modelCatalog;
  return modelCatalog.filter((model) => `${model.name} ${model.id}`.toLocaleLowerCase("hu").includes(normalizedQuery));
}

function modelResults(query, selectedModel) {
  const matches = matchingModels(query);
  if (!matches.length) return '<div class="model-empty">Nincs találat.</div>';
  return matches.slice(0, 50).map((model) => `<div class="model-option" role="option" data-model-id="${esc(model.id)}" aria-selected="${model.id === selectedModel}">${esc(model.name)} <code>${esc(model.id)}</code></div>`).join("");
}

function modelStatus(query) {
  if (modelCatalogMessage) return modelCatalogMessage;
  const count = matchingModels(query).length;
  return query.trim() ? `${count} találat` : `${count} modell`;
}

function refreshModelResults({ open = true } = {}) {
  const search = settingsBody.querySelector("#model-search");
  const selectedModel = settingsBody.querySelector("[name=selectedModel]").value;
  const results = settingsBody.querySelector("#model-results");
  const status = settingsBody.querySelector("#model-status");
  modelSearchQuery = search.value;
  results.innerHTML = modelResults(modelSearchQuery, selectedModel);
  results.hidden = !open;
  search.setAttribute("aria-expanded", String(open));
  status.textContent = modelStatus(search.value);
}

function profileFields(profile) {
  return `
    <div class="field"><label for="profile-interests">Mi érdekel?</label><input id="profile-interests" name="interests" maxlength="500" value="${esc(profile.interests)}" placeholder="Például zene, gaming vagy foci"></div>
    <div class="field"><label for="profile-background">Mondanál magadról valamit, ami segít példát választani?</label><textarea id="profile-background" name="background" maxlength="500" placeholder="Opcionális">${esc(profile.background)}</textarea></div>
    <div class="field"><label for="profile-goal">Mi a célod?</label><input id="profile-goal" name="goal" maxlength="500" value="${esc(profile.goal)}" placeholder="Például érettségi vagy informatika szak"></div>`;
}

function profileFrom(container) {
  return Object.fromEntries(["interests", "background", "goal"].map((key) => [key, container.querySelector(`[name="${key}"]`).value.trim()]));
}

function openOnboarding() {
  onboarding = { step: 0, profile: { ...localState.profile }, selected: new Set(), baselineMastery: { ...localState.mastery } };
  renderOnboarding();
  onboardingDialog.showModal();
}

function proposedCalibration() {
  return calibrationProposal(nodes, onboarding.baselineMastery, [...onboarding.selected]);
}

function renderOnboarding() {
  if (onboarding.step === 0) {
    onboardingBody.innerHTML = `
      <h2 id="onboarding-title">Üdv a MathRecapben</h2>
      <p>A készségfa segít átlátni, mit tudsz és mi nyílik meg a következő lépésként.</p>
      <p>A tudásszinteket mindig te állítod; a gyakorlás nem módosítja őket.</p>
      <div class="modal-actions"><button class="ghost" data-onboarding="skip">Most kihagyom</button><button data-onboarding="next">Tovább</button></div>`;
    return;
  }
  if (onboarding.step === 1) {
    onboardingBody.innerHTML = `
      <h2 id="onboarding-title">Egy rövid profil</h2>
      <p>Opcionális. Csak a későbbi személyre szabott példákhoz használjuk.</p>
      ${profileFields(onboarding.profile)}
      <div class="modal-actions"><button class="ghost" data-onboarding="back">Vissza</button><button class="ghost" data-onboarding="skip">Kihagyom</button><button data-onboarding="next">Tovább</button></div>`;
    return;
  }
  if (onboarding.step === 2) {
    const cards = ONBOARDING_SKILL_IDS.map((id) => byId.get(id)).filter(Boolean).map((skill) => `
      <label class="calibration-card"><input type="checkbox" data-calibration-id="${skill.id}" ${onboarding.selected.has(skill.id) ? "checked" : ""}>
        <span><code>${skill.id}</code><br>${esc(skill.name)}</span></label>`).join("");
    onboardingBody.innerHTML = `
      <h2 id="onboarding-title">Gyors kalibráció</h2>
      <p>Jelöld be, amit biztosan tudsz. Ezek 4-es szintet kapnak, az előfeltételeik pedig legalább 2-est.</p>
      <div class="calibration-grid">${cards}</div>
      <div class="modal-actions"><button class="ghost" data-onboarding="back">Vissza</button><button data-onboarding="review">Átnézem</button></div>`;
    return;
  }
  const proposed = proposedCalibration();
  const changes = skillIds.filter((id) => proposed[id] !== onboarding.baselineMastery[id]);
  onboardingBody.innerHTML = `
    <h2 id="onboarding-title">Átnézés</h2>
    <p><b>${changes.length} készség</b> kap új szintet a kiválasztásaid alapján.</p>
    <div class="review-list">${changes.length ? changes.map((id) => `<div class="review-row"><span><code>${id}</code> ${esc(byId.get(id).name)}</span><b>${onboarding.baselineMastery[id]} → ${proposed[id]}</b></div>`).join("") : "<p>Nincs javasolt módosítás.</p>"}</div>
    <div class="modal-actions"><button class="ghost" data-onboarding="undo">Visszavonom</button><button class="ghost" data-onboarding="back">Módosítom</button><button data-onboarding="complete">Belépés a fába</button></div>`;
}

function finishOnboarding({ applyCalibration }) {
  localState = { ...localState, profile: onboarding.profile, mastery: applyCalibration ? proposedCalibration() : onboarding.baselineMastery, onboardingComplete: true };
  persistLocalState();
  refreshLocks();
  onboardingDialog.close();
  onboarding = null;
  draw();
}

onboardingBody.addEventListener("input", (event) => {
  if (onboarding?.step === 1 && event.target.matches("[name]")) onboarding.profile = profileFrom(onboardingBody);
});
onboardingBody.addEventListener("change", (event) => {
  if (!event.target.matches("[data-calibration-id]")) return;
  const id = event.target.dataset.calibrationId;
  if (event.target.checked) onboarding.selected.add(id);
  else onboarding.selected.delete(id);
});
onboardingBody.addEventListener("click", (event) => {
  const action = event.target.closest("[data-onboarding]")?.dataset.onboarding;
  if (!action) return;
  if (action === "skip") return finishOnboarding({ applyCalibration: false });
  if (action === "next") onboarding.step += 1;
  if (action === "back") onboarding.step -= 1;
  if (action === "review") onboarding.step = 3;
  if (action === "undo") {
    localState = undoCalibrationProposal(localState, onboarding.baselineMastery);
    onboarding.selected.clear();
    onboarding.step = 2;
  }
  if (action === "complete") return finishOnboarding({ applyCalibration: true });
  renderOnboarding();
});
onboardingDialog.addEventListener("cancel", (event) => event.preventDefault());

async function loadModelCatalog() {
  modelCatalogMessage = "Modellek betöltése…";
  renderSettings();
  try {
    const response = await fetch("/api/models");
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("A modellkatalógus API nem érhető el. Indítsd az alkalmazást az npm start paranccsal, majd a http://127.0.0.1:3000 címet nyisd meg.");
    }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "A modelllista most nem érhető el.");
    modelCatalog = payload.models;
    modelCatalogMessage = modelCatalog.length ? "" : "A modelllista üres.";
  } catch (error) {
    modelCatalogMessage = error.message || "A modelllista most nem érhető el.";
  }
  if (settingsDialog.open) renderSettings();
}

function renderSettings() {
  const selectedModel = localState.selectedModel;
  const selected = modelCatalog.find((model) => model.id === selectedModel);
  settingsBody.innerHTML = `
    <h2 id="settings-title">Beállítások</h2>
    <p>A profil opcionális. Modell csak AI-műveletekhez kell.</p>
    ${profileFields(localState.profile)}
    <div class="field"><label for="model-search">OpenRouter modell</label><div class="model-picker"><input id="model-search" type="search" role="combobox" aria-controls="model-results" aria-expanded="false" aria-autocomplete="list" placeholder="Keress név vagy azonosító alapján" autocomplete="off" value="${esc(modelSearchQuery)}"><input type="hidden" name="selectedModel" value="${esc(selectedModel || "")}"><div id="model-results" class="model-results" role="listbox" hidden>${modelResults(modelSearchQuery, selectedModel)}</div></div><div class="selected-model" id="selected-model-label">${selected ? `Kiválasztva: ${esc(selected.name)} <code>${esc(selected.id)}</code>` : selectedModel ? `Kiválasztva: <code>${esc(selectedModel)}</code>` : "Nincs kiválasztva."}</div><div class="status" id="model-status">${esc(modelStatus(modelSearchQuery))}</div></div>
    <div class="modal-actions"><button class="ghost" data-settings="cancel">Mégse</button><button data-settings="save">Mentés</button></div>`;
}

document.getElementById("settings-button").addEventListener("click", () => {
  renderSettings();
  settingsDialog.showModal();
  loadModelCatalog();
});
settingsBody.addEventListener("input", (event) => {
  if (event.target.id === "model-search") refreshModelResults();
});
settingsBody.addEventListener("focusin", (event) => {
  if (event.target.id === "model-search") refreshModelResults();
});
settingsBody.addEventListener("click", (event) => {
  const modelOption = event.target.closest("[data-model-id]");
  if (modelOption) {
    const modelId = modelOption.dataset.modelId;
    const model = modelCatalog.find((item) => item.id === modelId);
    settingsBody.querySelector("[name=selectedModel]").value = modelId;
    settingsBody.querySelector("#selected-model-label").innerHTML = `Kiválasztva: ${esc(model.name)} <code>${esc(model.id)}</code>`;
    settingsBody.querySelector("#model-results").hidden = true;
    settingsBody.querySelector("#model-search").setAttribute("aria-expanded", "false");
    return;
  }
  const action = event.target.closest("[data-settings]")?.dataset.settings;
  if (action === "cancel") return settingsDialog.close();
  if (action === "save") {
    localState = updateProfileAndModel(localState, profileFrom(settingsBody), settingsBody.querySelector("[name=selectedModel]").value || null);
    persistLocalState();
    settingsDialog.close();
  }
});

// ---------------------------------------------------------------- fejléc

const chips = document.getElementById("chips");
BRANCH_ORDER.forEach((branch) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.innerHTML = `<i style="background:${BRANCHES[branch].color}"></i>${BRANCHES[branch].name}`;
  b.onclick = () => goToBranch(branch);
  chips.appendChild(b);
});
function goToBranch(branch) {
  const s = bands.find((x) => x.branch === branch);
  const z = Math.min(0.85, Math.min(W / (s.w + 200), H / worldHeight));
  const target = { z, x: W / 2 - (s.x + s.w / 2) * z, y: H / 2 - worldHeight / 2 * z };
  const start = { ...view }, t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 400);
    const e = 1 - Math.pow(1 - k, 3);
    view.x = start.x + (target.x - start.x) * e;
    view.y = start.y + (target.y - start.y) * e;
    view.z = start.z + (target.z - start.z) * e;
    draw();
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

const search = document.getElementById("search");
search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  matches = new Set();
  if (q.length >= 2) {
    for (const n of nodes) {
      if (n.id.toLowerCase().includes(q) || n.name.toLowerCase().includes(q)) matches.add(n.id);
    }
  }
  draw();
});
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && matches.size) {
    const n = byId.get([...matches][0]);
    selectNode(n); flyTo(n);
  }
  if (e.key === "Escape") resetTree();
});

window.addEventListener("keydown", (e) => {
  if (e.target === search) return;
  if (e.key === "/") { e.preventDefault(); search.focus(); return; }
  if (e.key === "f" || e.key === "F") fitToScreen();
  if (e.key === "g" || e.key === "G") { onlyGateways = !onlyGateways; draw(); }
  if (e.key === "Escape") resetTree();
  if (e.key >= "1" && e.key <= "6") goToBranch(BRANCH_ORDER[+e.key - 1]);
});

resize();
if (!localState.onboardingComplete) openOnboarding();
