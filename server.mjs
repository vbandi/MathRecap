import { createReadStream, statSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { generateUsefulness, generateWorksheet, listModels, normalizeOpenRouterError } from "./server/openrouter.mjs";
import { usefulnessRequestSchema, worksheetRequestSchema } from "./server/schemas.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const publicDir = join(root, "poc");
const katexDir = join(root, "node_modules", "katex", "dist");
const MAX_BODY_BYTES = 64 * 1024;
const MIME_TYPES = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".woff2": "font/woff2" };

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message) {
  sendJson(response, status, { error: { code, message } });
}

function readJson(request) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new OpenRequestError("payload_too_large", "A kérés túl nagy.", 413));
        return;
      }
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new OpenRequestError("invalid_json", "A kérés törzse érvénytelen JSON.", 400));
      }
    });
    request.on("error", reject);
  });
}

class OpenRequestError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function serveStatic(request, response, pathname) {
  const isKatex = pathname.startsWith("/vendor/katex/");
  const staticRoot = isKatex ? katexDir : publicDir;
  const requested = pathname === "/" ? "/index.html" : isKatex ? pathname.slice("/vendor/katex".length) : pathname;
  const candidate = normalize(join(staticRoot, requested));
  if (!candidate.startsWith(`${staticRoot}\\`) && candidate !== staticRoot) return sendError(response, 403, "forbidden", "A fájl nem érhető el.");
  try {
    if (!statSync(candidate).isFile()) return sendError(response, 404, "not_found", "A fájl nem található.");
  } catch {
    return sendError(response, 404, "not_found", "A fájl nem található.");
  }
  response.writeHead(200, { "Content-Type": MIME_TYPES[extname(candidate)] ?? "application/octet-stream", "X-Content-Type-Options": "nosniff" });
  createReadStream(candidate).pipe(response);
}

function validationError(error) {
  return { code: "invalid_request", message: "A kérés nem felel meg az elvárt formátumnak.", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
}

export function createAppServer({ apiKey = process.env.OPENROUTER_API_KEY, fetchImpl = globalThis.fetch, timeoutMs = 60_000 } = {}) {
  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/api/models") {
        const models = await listModels({ apiKey, fetchImpl, timeoutMs });
        return sendJson(response, 200, { models });
      }
      if (request.method === "POST" && url.pathname === "/api/usefulness") {
        const body = usefulnessRequestSchema.parse(await readJson(request));
        const usefulness = await generateUsefulness({ ...body, apiKey, fetchImpl, timeoutMs });
        return sendJson(response, 200, { usefulness });
      }
      if (request.method === "POST" && url.pathname === "/api/worksheets") {
        const body = worksheetRequestSchema.parse(await readJson(request));
        const validSkillIds = new Set([body.skill.id, ...body.skill.prerequisites, ...body.skill.relatedSkillIds]);
        const worksheet = await generateWorksheet({ ...body, apiKey, fetchImpl, timeoutMs, validSkillIds });
        return sendJson(response, 200, { worksheet });
      }
      if (url.pathname.startsWith("/api/")) return sendError(response, 404, "not_found", "Az API-végpont nem található.");
      if (request.method !== "GET" && request.method !== "HEAD") return sendError(response, 405, "method_not_allowed", "Ez a művelet nem támogatott.");
      if (request.method === "HEAD") return response.end();
      serveStatic(request, response, decodeURIComponent(url.pathname));
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = validationError(error);
        return sendJson(response, 400, { error: issue });
      }
      if (error instanceof OpenRequestError) return sendError(response, error.status, error.code, error.message);
      const normalized = normalizeOpenRouterError(error);
      return sendError(response, normalized.status, normalized.code, normalized.message);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  createAppServer().listen(port, "127.0.0.1", () => console.log(`MathRecap: http://127.0.0.1:${port}`));
}