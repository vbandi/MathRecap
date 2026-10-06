import { modelCatalogSchema, parseWorksheetResponse, usefulnessJsonSchema, usefulnessResponseSchema, worksheetJsonSchema } from "./schemas.mjs";
import { usefulnessMessages, worksheetCorrectionMessages, worksheetMessages, worksheetSkillIds } from "./prompts.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

export class OpenRouterError extends Error {
  constructor(code, message, status = 502, upstreamStatus = undefined) {
    super(message);
    this.code = code;
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
}

export function requireApiKey(apiKey) {
  if (!apiKey) {
    throw new OpenRouterError("configuration_required", "Az OPENROUTER_API_KEY nincs beállítva a helyi szerveren.", 503);
  }
}

export function normalizeOpenRouterError(error) {
  if (error instanceof OpenRouterError) return error;
  if (error?.name === "AbortError") return new OpenRouterError("timeout", "Az OpenRouter-kérés időtúllépés miatt megszakadt.", 504);
  const status = error?.status ?? error?.statusCode;
  if (status === 429) return new OpenRouterError("rate_limited", "Az OpenRouter átmenetileg korlátozza a kéréseket.", 429, status);
  if (status === 404) return new OpenRouterError("model_unavailable", "A kiválasztott modell jelenleg nem érhető el.", 404, status);
  return new OpenRouterError("upstream_error", "Az OpenRouter-kérés sikertelen volt. Próbáld később újra.", 502, status);
}

async function requestJson(path, { apiKey, fetchImpl, timeoutMs }) {
  requireApiKey(apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${OPENROUTER_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) throw { status: response.status };
    try {
      return await response.json();
    } catch {
      throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter érvénytelen választ adott.", 502);
    }
  } catch (error) {
    throw normalizeOpenRouterError(error);
  } finally {
    clearTimeout(timer);
  }
}

export async function listModels(options) {
  const payload = await requestJson("/models", options);
  const models = (Array.isArray(payload?.data) ? payload.data : []).map((model) => ({
    id: model?.id,
    name: model?.name ?? model?.id,
    contextLength: model?.context_length,
  }));
  try {
    return modelCatalogSchema.parse(models).sort((left, right) => left.name.localeCompare(right.name, "hu"));
  } catch {
    throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter modellkatalógusa érvénytelen volt.", 502);
  }
}

// OpenRouter rejects json_schema for models without structured-output support (400, or 404 when no
// endpoint supports it). Those fall back to plain JSON mode; the prompt carries the schema either way.
async function requestCompletion({ schemaName, jsonSchema, ...options }) {
  try {
    return await postCompletion(options, { type: "json_schema", json_schema: { name: schemaName, strict: false, schema: jsonSchema } });
  } catch (error) {
    if (error.upstreamStatus !== 400 && error.upstreamStatus !== 404) throw error;
    return postCompletion(options, { type: "json_object" });
  }
}

async function postCompletion({ apiKey, fetchImpl, timeoutMs, modelId, messages }, responseFormat) {
  requireApiKey(apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${OPENROUTER_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages,
        response_format: responseFormat,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw { status: response.status };
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter válasza hiányos.", 502);
    try {
      return JSON.parse(content);
    } catch {
      throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter nem érvényes JSON-t adott vissza.", 502);
    }
  } catch (error) {
    throw normalizeOpenRouterError(error);
  } finally {
    clearTimeout(timer);
  }
}

export async function generateUsefulness({ apiKey, fetchImpl, timeoutMs, modelId, profile, skill }) {
  const payload = await requestCompletion({
    apiKey, fetchImpl, timeoutMs, modelId, schemaName: "usefulness", jsonSchema: usefulnessJsonSchema,
    messages: usefulnessMessages({ profile, skill }),
  });
  try {
    return usefulnessResponseSchema.parse(payload);
  } catch {
    throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter indoklása érvénytelen volt.", 502);
  }
}

export async function generateWorksheet({ apiKey, fetchImpl, timeoutMs, modelId, profile, request, skill }) {
  const completionOptions = {
    apiKey, fetchImpl, timeoutMs, modelId, schemaName: "worksheet", jsonSchema: worksheetJsonSchema,
  };
  const validSkillIds = worksheetSkillIds(skill);
  const payload = await requestCompletion({ ...completionOptions, messages: worksheetMessages({ profile, request, skill }) });
  try {
    return parseWorksheetResponse(payload, validSkillIds);
  } catch (error) {
    const issues = (error?.issues ?? []).slice(0, 12).map((issue) => `${issue.path.join(".") || "(gyökér)"}: ${issue.message}`);
    const correctedPayload = await requestCompletion({
      ...completionOptions,
      messages: worksheetCorrectionMessages({ profile, request, skill, invalidResponse: payload, issues }),
    });
    try {
      return parseWorksheetResponse(correctedPayload, validSkillIds);
    } catch {
      throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter feladatlapja hiányos vagy érvénytelen volt.", 502);
    }
  }
}