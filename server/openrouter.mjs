import { modelCatalogSchema, parseWorksheetResponse, usefulnessResponseSchema, worksheetResponseSchema } from "./schemas.mjs";
import { usefulnessMessages, worksheetCorrectionMessages, worksheetMessages } from "./prompts.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

export class OpenRouterError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
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
  if (status === 429) return new OpenRouterError("rate_limited", "Az OpenRouter átmenetileg korlátozza a kéréseket.", 429);
  if (status === 404) return new OpenRouterError("model_unavailable", "A kiválasztott modell jelenleg nem érhető el.", 404);
  return new OpenRouterError("upstream_error", "Az OpenRouter-kérés sikertelen volt. Próbáld később újra.", 502);
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

async function requestCompletion({ apiKey, fetchImpl, timeoutMs, modelId, messages }) {
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
        response_format: { type: "json_object" },
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
    apiKey, fetchImpl, timeoutMs, modelId,
    messages: usefulnessMessages({ profile, skill }),
  });
  try {
    return usefulnessResponseSchema.parse(payload);
  } catch {
    throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter indoklása érvénytelen volt.", 502);
  }
}

export async function generateWorksheet({ apiKey, fetchImpl, timeoutMs, modelId, profile, request, skill, validSkillIds }) {
  const completionOptions = {
    apiKey, fetchImpl, timeoutMs, modelId,
  };
  const payload = await requestCompletion({ ...completionOptions, messages: worksheetMessages({ profile, request, skill }) });
  try {
    return parseWorksheetResponse(payload, validSkillIds);
  } catch {
    const correctedPayload = await requestCompletion({
      ...completionOptions,
      messages: worksheetCorrectionMessages({ profile, request, skill, invalidResponse: payload }),
    });
    try {
      return parseWorksheetResponse(correctedPayload, validSkillIds);
    } catch {
      throw new OpenRouterError("invalid_upstream_response", "Az OpenRouter feladatlapja hiányos vagy érvénytelen volt.", 502);
    }
  }
}