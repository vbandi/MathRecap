// Kiolvassa az agak/*.md táblázataiból a csomópontokat, és data.js-t ír.
// Futtatás: node poc/build-data.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agakDir = join(root, "agak");

const ROW = /^\|\s*\*\*([A-Z]{3}-\d+)\*\*\s*(⭐)?\s*\|(.+?)\|(.+?)\|(.+?)\|\s*$/;
const ID = /[A-Z]{3}-\d+/g;

const nodes = [];
const seen = new Set();

for (const file of readdirSync(agakDir).filter((f) => f.endsWith(".md")).sort()) {
  const text = readFileSync(join(agakDir, file), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = ROW.exec(line);
    if (!m) continue;
    const [, id, star, nev, leiras, elo] = m;
    if (seen.has(id)) throw new Error(`Duplikált azonosító: ${id}`);
    seen.add(id);
    nodes.push({
      id,
      ag: id.slice(0, 3),
      nev: clean(nev),
      leiras: clean(leiras),
      kapu: Boolean(star),
      elofeltetel: elo.match(ID) ?? [],
    });
  }
}

function clean(s) {
  return s.trim().replace(/\s+/g, " ").replace(/„|"/g, '"');
}

for (const n of nodes) {
  for (const p of n.elofeltetel) {
    if (!seen.has(p)) throw new Error(`${n.id} ismeretlen előfeltételre hivatkozik: ${p}`);
  }
}

const out = `// Generált fájl - ne szerkeszd. Forrás: agak/*.md, generátor: poc/build-data.mjs
window.TREE_NODES = ${JSON.stringify(nodes, null, 1)};
`;
writeFileSync(join(root, "poc", "data.js"), out, "utf8");

const perAg = {};
for (const n of nodes) perAg[n.ag] = (perAg[n.ag] ?? 0) + 1;
console.log(`${nodes.length} csomópont, ${nodes.reduce((a, n) => a + n.elofeltetel.length, 0)} él`);
console.log(perAg);
console.log(`kapunode: ${nodes.filter((n) => n.kapu).length}`);
