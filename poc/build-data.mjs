// Kiolvassa az agak/*.md táblázataiból a csomópontokat, és data.js-t ír.
// Futtatás: node poc/build-data.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const branchesDir = join(root, "agak");

const ROW = /^\|\s*\*\*([A-Z]{3}-\d+)\*\*\s*(⭐)?\s*\|(.+?)\|(.+?)\|(.+?)\|\s*$/;
const ID = /[A-Z]{3}-\d+/g;

const nodes = [];
const seen = new Set();

for (const file of readdirSync(branchesDir).filter((fileName) => fileName.endsWith(".md")).sort()) {
  const text = readFileSync(join(branchesDir, file), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = ROW.exec(line);
    if (!match) continue;
    const [, id, star, name, description, prerequisites] = match;
    if (seen.has(id)) throw new Error(`Duplikált azonosító: ${id}`);
    seen.add(id);
    nodes.push({
      id,
      branch: id.slice(0, 3),
      name: clean(name),
      description: clean(description),
      gateway: Boolean(star),
      prerequisites: prerequisites.match(ID) ?? [],
    });
  }
}

function clean(s) {
  return s.trim().replace(/\s+/g, " ").replace(/„|"/g, '"');
}

for (const node of nodes) {
  for (const prerequisiteId of node.prerequisites) {
    if (!seen.has(prerequisiteId)) throw new Error(`${node.id} ismeretlen előfeltételre hivatkozik: ${prerequisiteId}`);
  }
}

const out = `// Generált fájl - ne szerkeszd. Forrás: agak/*.md, generátor: poc/build-data.mjs
window.TREE_NODES = ${JSON.stringify(nodes, null, 1)};
`;
writeFileSync(join(root, "poc", "data.js"), out, "utf8");

const perBranch = {};
for (const node of nodes) perBranch[node.branch] = (perBranch[node.branch] ?? 0) + 1;
console.log(`${nodes.length} csomópont, ${nodes.reduce((total, node) => total + node.prerequisites.length, 0)} él`);
console.log(perBranch);
console.log(`kapunode: ${nodes.filter((node) => node.gateway).length}`);
