"use strict";

import { cacheUsefulness, calibrationProposal, loadLocalState, recomputeLocks, saveLocalState, setManualMastery, undoCalibrationProposal, updateProfileAndModel, usefulnessDisplayState } from "./state.js";

const AGAK = {
  LOG: { nev: "Logika", szin: "#6C5CE7", sotetSzoveg: false },
  SZA: { nev: "Számok", szin: "#0B84D6", sotetSzoveg: false },
  ALG: { nev: "Algebra", szin: "#00A085", sotetSzoveg: false },
  FUG: { nev: "Függvények", szin: "#E8A33D", sotetSzoveg: true },
  GEO: { nev: "Geometria", szin: "#D94F45", sotetSzoveg: false },
  ESE: { nev: "Esély", szin: "#C2559E", sotetSzoveg: false },
};
const AG_SORREND = ["LOG", "SZA", "ALG", "FUG", "GEO", "ESE"];

const SZINT_NEV = ["nem ismerem", "hallottam róla", "értem", "megy", "biztos tudom"];
const SZINT_HORGONY = [
  "nem tudom, mi ez",
  "rémlik, de nem tudnám elmagyarázni",
  "el tudom magyarázni, de feladatnál elakadok",
  "megoldom, ha van rá időm",
  "dolgozatban is menne, segítség nélkül",
];

const NW = 176, NH = 64;          // csomópont
const SLOT_W = 204, SLOT_H = 124; // rács
const AG_GAP = 72;
const SAV_TETEJE = 54;            // hely az ágfeliratnak
const CIMKE_KUSZOB = 0.5;         // az egyetlen zoom-küszöb

// ---------------------------------------------------------------- adatok

const nodes = window.TREE_NODES;
const byId = new Map(nodes.map((n) => [n.id, n]));

for (const n of nodes) {
  n.utodok = [];
  n.szint = 0;
  n.zarolt = false;
}
for (const n of nodes) {
  for (const p of n.elofeltetel) byId.get(p).utodok.push(n.id);
}

// Réteg = leghosszabb út a gyökerektől; egyben topologikus sorrend.
const topoSorrend = (function () {
  const bejovo = new Map(nodes.map((n) => [n.id, n.elofeltetel.length]));
  const sor = nodes.filter((n) => n.elofeltetel.length === 0).map((n) => n.id);
  const out = [];
  for (const n of nodes) n.reteg = 0;
  while (sor.length) {
    const id = sor.shift();
    out.push(id);
    for (const u of byId.get(id).utodok) {
      const un = byId.get(u);
      un.reteg = Math.max(un.reteg, byId.get(id).reteg + 1);
      const maradek = bejovo.get(u) - 1;
      bejovo.set(u, maradek);
      if (maradek === 0) sor.push(u);
    }
  }
  if (out.length !== nodes.length) console.warn("Kör a gráfban!");
  return out;
})();

const MAX_RETEG = Math.max(...nodes.map((n) => n.reteg));

// ---------------------------------------------------------------- elrendezés

let vilagSzeles = 0;
const vilagMagas = (MAX_RETEG + 1) * SLOT_H + SAV_TETEJE + 40;
const savok = [];

(function elrendezes() {
  let x = 0;
  for (const ag of AG_SORREND) {
    const tagok = nodes.filter((n) => n.ag === ag);
    const sorok = [];
    for (const n of tagok) (sorok[n.reteg] ??= []).push(n);

    // Barycenter-simítás: a csomópont az előzményei/utódai átlagos oszlopa köré kerül.
    const oszlop = new Map(tagok.map((n) => [n.id, 0]));
    const ujraszamol = () => {
      for (const sor of sorok) if (sor) sor.forEach((n, i) => oszlop.set(n.id, i));
    };
    ujraszamol();
    const atlag = (n, mezo) => {
      const relevans = n[mezo].filter((id) => oszlop.has(id));
      if (!relevans.length) return oszlop.get(n.id);
      return relevans.reduce((a, id) => a + oszlop.get(id), 0) / relevans.length;
    };
    for (let pass = 0; pass < 4; pass++) {
      const lefele = pass % 2 === 0;
      const indexek = [...sorok.keys()];
      for (const r of lefele ? indexek : indexek.reverse()) {
        if (!sorok[r]) continue;
        sorok[r].sort((a, b) => atlag(a, lefele ? "elofeltetel" : "utodok") - atlag(b, lefele ? "elofeltetel" : "utodok"));
        ujraszamol();
      }
    }

    const szelesseg = Math.max(...sorok.filter(Boolean).map((s) => s.length));
    for (const sor of sorok) {
      if (!sor) continue;
      const eltolas = ((szelesseg - sor.length) / 2) * SLOT_W;
      sor.forEach((n, i) => {
        n.x = x + eltolas + i * SLOT_W + SLOT_W / 2;
        n.y = SAV_TETEJE + n.reteg * SLOT_H + SLOT_H / 2;
      });
    }

    savok.push({ ag, x, w: szelesseg * SLOT_W });
    x += szelesseg * SLOT_W + AG_GAP;
  }
  vilagSzeles = x - AG_GAP;
})();

const elek = [];
for (const n of nodes) {
  for (const p of n.elofeltetel) {
    elek.push({ from: byId.get(p), to: n, kereszt: byId.get(p).ag !== n.ag });
  }
}

// ---------------------------------------------------------------- kezdőállapot

const skillIds = nodes.map((node) => node.id);
let localState = loadLocalState(window.localStorage, skillIds);

function persistLocalState() {
  localState = saveLocalState(window.localStorage, localState, skillIds);
}

function frissitZarolas() {
  const locks = recomputeLocks(nodes, localState.mastery);
  for (const n of nodes) {
    n.szint = localState.mastery[n.id];
    n.zarolt = locks[n.id];
  }
}
persistLocalState();
frissitZarolas();

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
let hover = null, kivalasztott = null;
let usefulnessFallbackSkillId = null;
let usefulnessRefreshFailedSkillId = null;
let csakKapu = false;
let talalatok = new Set();
let kiemeltFel = new Set(), kiemeltLe = new Set();

let elsoMeres = true;
function meret() {
  dpr = window.devicePixelRatio || 1;
  W = cv.clientWidth;
  H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  // A vászon 0×0-ként is betöltődhet (rejtett fül); az első valódi mérésnél illesztünk.
  if (elsoMeres) { elsoMeres = false; kezdoNezet(); }
  else rajzol();
}
new ResizeObserver(meret).observe(cv);

function kepernyore() {
  if (!W || !H) return;
  const pad = 60;
  const z = Math.min((W - pad * 2) / vilagSzeles, (H - pad * 2) / vilagMagas);
  view.z = z;
  view.x = (W - vilagSzeles * z) / 2;
  view.y = (H - vilagMagas * z) / 2;
  rajzol();
}

// A teljes fa áttekintő zoomon olvashatatlan; induláskor ezért a címkeküszöb fölött kezdünk.
function kezdoNezet() {
  if (!W || !H) return;
  view.z = 0.58;
  view.x = W / 2 - (vilagSzeles / 2) * view.z;
  view.y = 24;
  rajzol();
}

// ---------------------------------------------------------------- rajzolás

function agSzinRGBA(ag, a) {
  const h = AGAK[ag].szin;
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
function nevSorok(n) {
  if (sorokCache.has(n.id)) return sorokCache.get(n.id);
  ctx.font = "12.5px 'Segoe UI', system-ui, sans-serif";
  const max = NW - 20;
  const szavak = n.nev.split(" ");
  const sorok = [];
  let akt = "";
  for (const sz of szavak) {
    const proba = akt ? akt + " " + sz : sz;
    if (ctx.measureText(proba).width > max && akt) { sorok.push(akt); akt = sz; }
    else akt = proba;
    if (sorok.length === 2) break;
  }
  if (sorok.length < 2 && akt) sorok.push(akt);
  if (sorok.length === 2 && ctx.measureText(sorok[1]).width > max - 10) {
    while (sorok[1].length > 4 && ctx.measureText(sorok[1] + "…").width > max) sorok[1] = sorok[1].slice(0, -1);
    sorok[1] += "…";
  }
  sorokCache.set(n.id, sorok);
  return sorok;
}

function lathatosag(n) {
  if (kiemeltFel.size || kiemeltLe.size) {
    const benne = n === hover || n === kivalasztott || kiemeltFel.has(n.id) || kiemeltLe.has(n.id);
    if (!benne) return 0.1;
  }
  if (talalatok.size && !talalatok.has(n.id)) return 0.15;
  if (csakKapu && !n.kapu) return 0.08;
  return 1;
}

function rajzol() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.z, view.z);

  // ágsávok
  for (const s of savok) {
    ctx.fillStyle = agSzinRGBA(s.ag, 0.035);
    ctx.fillRect(s.x, 0, s.w, vilagMagas);
    ctx.fillStyle = agSzinRGBA(s.ag, 0.55);
    ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(AGAK[s.ag].nev.toUpperCase(), s.x + s.w / 2, 34);
  }
  ctx.textAlign = "left";

  // élek
  for (const e of elek) {
    const a = Math.min(lathatosag(e.from), lathatosag(e.to));
    let szin = `rgba(150,160,180,${0.3 * a})`, vastag = 1.2;
    const kiemelt = (kiemeltFel.has(e.from.id) || e.from === hover || e.from === kivalasztott) &&
                    (kiemeltFel.has(e.to.id) || e.to === hover || e.to === kivalasztott);
    const utodEl = (kiemeltLe.has(e.to.id)) &&
                   (kiemeltLe.has(e.from.id) || e.from === hover || e.from === kivalasztott);
    if (kiemelt) { szin = "rgba(120,170,255,.9)"; vastag = 2; }
    else if (utodEl) { szin = "rgba(232,163,61,.85)"; vastag = 2; }

    ctx.strokeStyle = szin;
    ctx.lineWidth = vastag;
    ctx.setLineDash(e.kereszt ? [6, 5] : []);
    const y1 = e.from.y + NH / 2, y2 = e.to.y - NH / 2;
    const k = Math.min(60, Math.max(24, (y2 - y1) / 2));
    ctx.beginPath();
    ctx.moveTo(e.from.x, y1);
    ctx.bezierCurveTo(e.from.x, y1 + k, e.to.x, y2 - k, e.to.x, y2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // csomópontok
  const cimkek = view.z >= CIMKE_KUSZOB;
  for (const n of nodes) {
    const a = lathatosag(n);
    if (a < 0.02) continue;
    ctx.globalAlpha = a;
    const x = n.x - NW / 2, y = n.y - NH / 2;
    const info = AGAK[n.ag];

    if (n.zarolt) {
      rrect(ctx, x, y, NW, NH, 8);
      ctx.fillStyle = "#14161c";
      ctx.fill();
      ctx.strokeStyle = "#333a48";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      rrect(ctx, x, y, NW, NH, 8);
      ctx.fillStyle = n.szint === 0 ? "#181b23" : agSzinRGBA(n.ag, 0.14 + (n.szint / 4) * 0.86);
      ctx.fill();
      ctx.strokeStyle = info.szin;
      ctx.lineWidth = n.kapu ? 2.6 : 1.4;
      ctx.stroke();
    }
    if (talalatok.has(n.id)) {
      rrect(ctx, x - 4, y - 4, NW + 8, NH + 8, 11);
      ctx.strokeStyle = "#ffd479";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (n === kivalasztott) {
      rrect(ctx, x - 5, y - 5, NW + 10, NH + 10, 12);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const teli = !n.zarolt && n.szint >= 3;
    const fo = n.zarolt ? "#5d6579" : teli ? (info.sotetSzoveg ? "#2B2B2B" : "#ffffff") : "#ced4e2";
    const halvany = n.zarolt ? "#4b5266" : teli ? (info.sotetSzoveg ? "rgba(43,43,43,.65)" : "rgba(255,255,255,.7)") : "#818aa0";

    if (cimkek) {
      ctx.font = "10.5px ui-monospace, Consolas, monospace";
      ctx.fillStyle = halvany;
      ctx.fillText(n.id, x + 10, y + 16);
      if (n.kapu) {
        ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText("★", x + NW - 20, y + 16);
      }
      ctx.font = "12.5px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = fo;
      nevSorok(n).forEach((s, i) => ctx.fillText(s, x + 10, y + 34 + i * 15));
    } else if (n.kapu) {
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

    if (!n.zarolt) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i <= n.szint ? (teli ? halvany : info.szin) : "rgba(255,255,255,.13)";
        ctx.fillRect(x + 10 + i * 9, y + NH - 12, 6, 5);
      }
    } else {
      ctx.fillStyle = "#3b4254";
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText("zárolt", x + 10, y + NH - 8);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  minimapRajzol();
}

function minimapRajzol() {
  const s = Math.min(mm.width / vilagSzeles, mm.height / vilagMagas);
  const ox = (mm.width - vilagSzeles * s) / 2, oy = (mm.height - vilagMagas * s) / 2;
  mmx.clearRect(0, 0, mm.width, mm.height);
  for (const n of nodes) {
    mmx.fillStyle = n.zarolt ? "rgba(90,98,120,.5)" : agSzinRGBA(n.ag, 0.35 + (n.szint / 4) * 0.65);
    mmx.fillRect(ox + (n.x - NW / 2) * s, oy + (n.y - NH / 2) * s, Math.max(2, NW * s), Math.max(2, NH * s));
  }
  mmx.strokeStyle = "rgba(255,255,255,.8)";
  mmx.lineWidth = 1.5;
  mmx.strokeRect(ox + (-view.x / view.z) * s, oy + (-view.y / view.z) * s, (W / view.z) * s, (H / view.z) * s);
  mm._s = s; mm._ox = ox; mm._oy = oy;
}

// ---------------------------------------------------------------- interakció

function vilagra(sx, sy) {
  return { x: (sx - view.x) / view.z, y: (sy - view.y) / view.z };
}
function talal(sx, sy) {
  const p = vilagra(sx, sy);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (csakKapu && !n.kapu) continue;
    if (Math.abs(p.x - n.x) <= NW / 2 && Math.abs(p.y - n.y) <= NH / 2) return n;
  }
  return null;
}

let huz = null, mozgott = false;
cv.addEventListener("pointerdown", (e) => {
  huz = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  mozgott = false;
  cv.setPointerCapture(e.pointerId);
  cv.classList.add("dragging");
});
cv.addEventListener("pointermove", (e) => {
  const r = cv.getBoundingClientRect();
  if (huz) {
    const dx = e.clientX - huz.sx, dy = e.clientY - huz.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) mozgott = true;
    view.x = huz.vx + dx;
    view.y = huz.vy + dy;
    rajzol();
    return;
  }
  const n = talal(e.clientX - r.left, e.clientY - r.top);
  if (n !== hover) {
    hover = n;
    if (!kivalasztott) kiemelesFrissit(n);
    rajzol();
  }
  if (n) {
    tip.style.display = "block";
    tip.style.left = Math.min(e.clientX - r.left + 14, W - 280) + "px";
    tip.style.top = e.clientY - r.top + 66 + "px";
    tip.innerHTML = `<b>${n.id}</b> · ${esc(n.nev)}<br><span class="t">${
      n.zarolt ? "zárolt — hiányzik: " + n.elofeltetel.filter((p) => byId.get(p).szint < 2).join(", ")
               : SZINT_NEV[n.szint] + " · " + n.utodok.length + " készséget nyit meg"}</span>`;
  } else {
    tip.style.display = "none";
  }
});
cv.addEventListener("pointerleave", () => {
  tip.style.display = "none";
  if (hover && !kivalasztott) { hover = null; kiemelesFrissit(null); rajzol(); }
});
cv.addEventListener("pointerup", (e) => {
  cv.classList.remove("dragging");
  const volt = huz;
  huz = null;
  if (mozgott || !volt) return;
  const r = cv.getBoundingClientRect();
  const n = talal(e.clientX - r.left, e.clientY - r.top);
  n ? valaszt(n) : bezar();
});
cv.addEventListener("dblclick", (e) => {
  const r = cv.getBoundingClientRect();
  const n = talal(e.clientX - r.left, e.clientY - r.top);
  if (n) repul(n, 1.1);
});
cv.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const elotte = vilagra(sx, sy);
  const uj = Math.min(2.2, Math.max(0.1, view.z * Math.pow(1.0015, -e.deltaY)));
  view.z = uj;
  view.x = sx - elotte.x * uj;
  view.y = sy - elotte.y * uj;
  rajzol();
}, { passive: false });

let mmHuz = false;
function miniterkepKamerara(e) {
  const r = mm.getBoundingClientRect();
  const wx = ((e.clientX - r.left) * (mm.width / r.width) - mm._ox) / mm._s;
  const wy = ((e.clientY - r.top) * (mm.height / r.height) - mm._oy) / mm._s;
  view.x = W / 2 - wx * view.z;
  view.y = H / 2 - wy * view.z;
  rajzol();
}
mm.addEventListener("pointerdown", (e) => {
  mmHuz = true;
  mm.setPointerCapture(e.pointerId);
  miniterkepKamerara(e);
});
mm.addEventListener("pointermove", (e) => {
  if (mmHuz) miniterkepKamerara(e);
});
mm.addEventListener("pointerup", (e) => {
  mmHuz = false;
  mm.releasePointerCapture(e.pointerId);
});
mm.addEventListener("pointercancel", () => {
  mmHuz = false;
});

function repul(n, z = 1.1) {
  const cel = { z, x: W / 2 - n.x * z, y: H / 2 - n.y * z };
  const start = { ...view }, t0 = performance.now();
  (function lep(t) {
    const k = Math.min(1, (t - t0) / 380);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    view.x = start.x + (cel.x - start.x) * e;
    view.y = start.y + (cel.y - start.y) * e;
    view.z = start.z + (cel.z - start.z) * e;
    rajzol();
    if (k < 1) requestAnimationFrame(lep);
  })(t0);
}

function bejar(n, mezo) {
  const ki = new Set(), sor = [...n[mezo]];
  while (sor.length) {
    const id = sor.pop();
    if (ki.has(id)) continue;
    ki.add(id);
    sor.push(...byId.get(id)[mezo]);
  }
  return ki;
}
function kiemelesFrissit(n) {
  kiemeltFel = n ? bejar(n, "elofeltetel") : new Set();
  kiemeltLe = n ? bejar(n, "utodok") : new Set();
}

// ---------------------------------------------------------------- panel

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function pips(sz, ag) {
  return `<span class="pips">${[0, 1, 2, 3, 4]
    .map((i) => `<i style="background:${i <= sz ? AGAK[ag].szin : "#2c313d"}"></i>`).join("")}</span>`;
}
function depSor(id) {
  const n = byId.get(id);
  return `<div class="dep" data-goto="${n.id}">${pips(n.zarolt ? -1 : n.szint, n.ag)}
    <span class="nm">${esc(n.nev)}</span> <span class="id">${n.id}</span></div>`;
}

function valaszt(n) {
  kivalasztott = n;
  kiemelesFrissit(n);
  panelRajzol();
  panel.classList.add("open");
  rajzol();
}
function bezar() {
  kivalasztott = null;
  kiemelesFrissit(hover);
  panel.classList.remove("open");
  rajzol();
}
function teljesFaVisszaallitas() {
  hover = null;
  kivalasztott = null;
  talalatok = new Set();
  kereso.value = "";
  kereso.blur();
  tip.style.display = "none";
  kiemelesFrissit(null);
  panel.classList.remove("open");
  rajzol();
}

function panelRajzol() {
  const n = kivalasztott;
  if (!n) return;
  const hianyzo = n.elofeltetel.filter((p) => byId.get(p).zarolt || byId.get(p).szint < 2);
  const usefulnessState = usefulnessDisplayState(localState, n.id, usefulnessRefreshFailedSkillId === n.id);
  const usefulness = usefulnessState.text
    ? `<div class="usefulness-text">${esc(usefulnessState.text)}</div>${usefulnessState.refreshFailed ? '<div class="usefulness-error" role="alert">Nem sikerült frissíteni az indoklást. <button class="text-button" data-act="usefulness-retry">Próbáld újra</button></div>' : ""}<button class="text-button" data-act="usefulness">Mást kérek</button>`
    : usefulnessFallbackSkillId === n.id
      ? `<div class="usefulness-error" role="alert">Most nem sikerült valós példát készíteni ehhez a készséghez. <button class="text-button" data-act="usefulness-retry">Próbáld újra</button></div>`
    : `<em>${localState.selectedModel ? "Kérhetsz rövid, személyre szabott indoklást." : "Állíts be egy modellt a személyre szabott indokláshoz."}</em><button class="text-button" data-act="usefulness" ${localState.selectedModel ? "" : "disabled"}>Miért jó nekem?</button>`;
  panelBody.innerHTML = `
    <h2>${esc(n.nev)}</h2>
    <div class="sub"><span style="color:${AGAK[n.ag].szin}">●</span> ${AGAK[n.ag].nev} ága ·
      <code>${n.id}</code> · ${n.reteg + 1}. réteg${n.kapu ? " · ★ kapunode" : ""}</div>

    ${n.zarolt ? `<div class="locked">Zárolt — előbb ezek kellenek legalább 2. szinten:
        ${hianyzo.map((h) => `<b>${h}</b>`).join(", ")}</div>` : ""}

    <div class="block"><div class="lbl">Mi ez</div>${esc(n.leiras)}</div>

    <div class="block ai"><div class="lbl">Miért jó neked</div>${usefulness}</div>

    <div class="block"><div class="lbl">Előfeltételek (${n.elofeltetel.length})</div>
      ${n.elofeltetel.length ? n.elofeltetel.map(depSor).join("") : '<span class="sub">nincs — kiindulópont</span>'}</div>

    <div class="block"><div class="lbl">Ezt nyitja meg (${n.utodok.length})</div>
      ${n.utodok.length ? n.utodok.map(depSor).join("") : '<span class="sub">a lánc vége</span>'}</div>

    <div class="block"><div class="lbl">Mennyire tudod?</div>
      <div class="slider">${[0, 1, 2, 3, 4]
        .map((i) => `<button data-lvl="${i}" class="${!n.zarolt && n.szint === i ? "on" : ""}"
          ${n.zarolt ? "disabled" : ""}>${i}</button>`).join("")}</div>
      <div class="lvltext">${n.zarolt ? "—" : `<b>${SZINT_NEV[n.szint]}</b> · „${SZINT_HORGONY[n.szint]}"`}</div></div>

    <div class="actions">
      <button data-act="path">Ezt akarom tanulni</button>
      <button class="ghost" data-act="gyak">Gyakorlás →</button>
    </div>`;
}

panelBody.addEventListener("click", (e) => {
  const dep = e.target.closest("[data-goto]");
  if (dep) { const n = byId.get(dep.dataset.goto); valaszt(n); repul(n); return; }
  const lvl = e.target.closest("[data-lvl]");
  if (lvl) {
    localState = setManualMastery(localState, skillIds, kivalasztott.id, +lvl.dataset.lvl);
    localState = saveLocalState(window.localStorage, localState, skillIds);
    frissitZarolas();
    panelRajzol();
    rajzol();
    return;
  }
  const act = e.target.closest("[data-act]");
  if (act?.dataset.act === "path") utvonal(kivalasztott);
  if (act?.dataset.act === "gyak") window.location.assign(`worksheet.html?skill=${encodeURIComponent(kivalasztott.id)}`);
  if (act?.dataset.act === "usefulness" || act?.dataset.act === "usefulness-retry") generateUsefulness(kivalasztott);
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
        skill: { id: skill.id, nev: skill.nev, leiras: skill.leiras, prerequisites: skill.elofeltetel, relatedSkillIds: skill.utodok },
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
  if (kivalasztott?.id === skill.id) panelRajzol();
}
panel.querySelector(".close").addEventListener("click", bezar);

function utvonal(n) {
  const kell = [...bejar(n, "elofeltetel")].map(byId.get.bind(byId)).filter((x) => x.szint < 2);
  talalatok = new Set([n.id, ...kell.map((x) => x.id)]);
  kiemeltFel = new Set(); kiemeltLe = new Set();
  const sorrend = topoSorrend.filter((id) => talalatok.has(id) && id !== n.id);
  tipTartos(`<b>${n.id}</b> · ${kell.length} készség hiányzik<br><span class="t">${
    sorrend.slice(0, 12).map((id) => esc(byId.get(id).nev)).join(" → ")}</span>`);
  rajzol();
}
function tipTartos(html) {
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
    <div class="field"><label for="profile-erdeklodes">Mi érdekel?</label><input id="profile-erdeklodes" name="erdeklodes" maxlength="500" value="${esc(profile.erdeklodes)}" placeholder="Például zene, gaming vagy foci"></div>
    <div class="field"><label for="profile-sajat">Mondanál magadról valamit, ami segít példát választani?</label><textarea id="profile-sajat" name="sajat" maxlength="500" placeholder="Opcionális">${esc(profile.sajat)}</textarea></div>
    <div class="field"><label for="profile-cel">Mi a célod?</label><input id="profile-cel" name="cel" maxlength="500" value="${esc(profile.cel)}" placeholder="Például érettségi vagy informatika szak"></div>`;
}

function profileFrom(container) {
  return Object.fromEntries(["erdeklodes", "sajat", "cel"].map((key) => [key, container.querySelector(`[name="${key}"]`).value.trim()]));
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
        <span><code>${skill.id}</code><br>${esc(skill.nev)}</span></label>`).join("");
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
    <div class="review-list">${changes.length ? changes.map((id) => `<div class="review-row"><span><code>${id}</code> ${esc(byId.get(id).nev)}</span><b>${onboarding.baselineMastery[id]} → ${proposed[id]}</b></div>`).join("") : "<p>Nincs javasolt módosítás.</p>"}</div>
    <div class="modal-actions"><button class="ghost" data-onboarding="undo">Visszavonom</button><button class="ghost" data-onboarding="back">Módosítom</button><button data-onboarding="complete">Belépés a fába</button></div>`;
}

function finishOnboarding({ applyCalibration }) {
  localState = { ...localState, profile: onboarding.profile, mastery: applyCalibration ? proposedCalibration() : onboarding.baselineMastery, onboardingComplete: true };
  persistLocalState();
  frissitZarolas();
  onboardingDialog.close();
  onboarding = null;
  rajzol();
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
AG_SORREND.forEach((ag) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.innerHTML = `<i style="background:${AGAK[ag].szin}"></i>${AGAK[ag].nev}`;
  b.onclick = () => agra(ag);
  chips.appendChild(b);
});
function agra(ag) {
  const s = savok.find((x) => x.ag === ag);
  const z = Math.min(0.85, Math.min(W / (s.w + 200), H / vilagMagas));
  const cel = { z, x: W / 2 - (s.x + s.w / 2) * z, y: H / 2 - vilagMagas / 2 * z };
  const start = { ...view }, t0 = performance.now();
  (function lep(t) {
    const k = Math.min(1, (t - t0) / 400);
    const e = 1 - Math.pow(1 - k, 3);
    view.x = start.x + (cel.x - start.x) * e;
    view.y = start.y + (cel.y - start.y) * e;
    view.z = start.z + (cel.z - start.z) * e;
    rajzol();
    if (k < 1) requestAnimationFrame(lep);
  })(t0);
}

const kereso = document.getElementById("search");
kereso.addEventListener("input", () => {
  const q = kereso.value.trim().toLowerCase();
  talalatok = new Set();
  if (q.length >= 2) {
    for (const n of nodes) {
      if (n.id.toLowerCase().includes(q) || n.nev.toLowerCase().includes(q)) talalatok.add(n.id);
    }
  }
  rajzol();
});
kereso.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && talalatok.size) {
    const n = byId.get([...talalatok][0]);
    valaszt(n); repul(n);
  }
  if (e.key === "Escape") teljesFaVisszaallitas();
});

window.addEventListener("keydown", (e) => {
  if (e.target === kereso) return;
  if (e.key === "/") { e.preventDefault(); kereso.focus(); return; }
  if (e.key === "f" || e.key === "F") kepernyore();
  if (e.key === "g" || e.key === "G") { csakKapu = !csakKapu; rajzol(); }
  if (e.key === "Escape") teljesFaVisszaallitas();
  if (e.key >= "1" && e.key <= "6") agra(AG_SORREND[+e.key - 1]);
});

meret();
if (!localState.onboardingComplete) openOnboarding();
