using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

namespace MathRecap.Api.Ai;

// Chat completions with structured output from OpenRouter. Failures become ApiExceptions with
// Hungarian messages; neither the API key nor upstream response bodies reach the client or the logs.
public sealed class OpenRouterClient(HttpClient http, IOptions<OpenRouterOptions> options, ILogger<OpenRouterClient> logger)
{
    // Returns the message content of the completion: the model's JSON answer as text.
    public async Task<string> CompleteAsync(string schemaName, string schemaText, IReadOnlyList<ChatMessage> messages, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrEmpty(settings.ApiKey))
        {
            throw new ApiException(StatusCodes.Status503ServiceUnavailable, "configuration_required", "Az OPENROUTER_API_KEY nincs beállítva a helyi szerveren.");
        }

        var structuredOutput = new JsonObject
        {
            ["type"] = "json_schema",
            ["json_schema"] = new JsonObject { ["name"] = schemaName, ["strict"] = false, ["schema"] = JsonNode.Parse(schemaText) },
        };
        var (status, body) = await PostAsync(settings, messages, structuredOutput, cancellationToken);
        // OpenRouter rejects json_schema for models without structured-output support (400, or 404 when no
        // endpoint supports it). Those fall back to plain JSON mode; the prompt carries the schema either way.
        if (status is HttpStatusCode.BadRequest or HttpStatusCode.NotFound)
        {
            logger.LogInformation("OpenRouter rejected structured output with {StatusCode}; retrying in JSON mode.", (int)status);
            (status, body) = await PostAsync(settings, messages, new JsonObject { ["type"] = "json_object" }, cancellationToken);
        }
        return body is null ? throw UpstreamError(status) : ContentOf(body);
    }

    // The status and, for a successful response, the body. The timeout covers reading the body too.
    private async Task<(HttpStatusCode Status, string? Body)> PostAsync(OpenRouterOptions settings, IReadOnlyList<ChatMessage> messages, JsonObject responseFormat, CancellationToken cancellationToken)
    {
        var payload = new JsonObject
        {
            ["model"] = settings.Model,
            ["messages"] = JsonSerializer.SerializeToNode(messages, JsonSerializerOptions.Web),
            ["response_format"] = responseFormat,
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri($"{settings.BaseUrl!.AbsoluteUri.TrimEnd('/')}/chat/completions"))
        {
            Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(settings.Timeout);
        try
        {
            using var response = await http.SendAsync(request, timeout.Token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("OpenRouter answered {StatusCode}.", (int)response.StatusCode);
                return (response.StatusCode, null);
            }
            return (response.StatusCode, await response.Content.ReadAsStringAsync(timeout.Token));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("The OpenRouter request timed out after {Timeout}.", settings.Timeout);
            throw new ApiException(StatusCodes.Status504GatewayTimeout, "timeout", "Az OpenRouter-kérés időtúllépés miatt megszakadt.");
        }
        catch (HttpRequestException error)
        {
            logger.LogWarning("The OpenRouter request failed: {Error}.", error.HttpRequestError);
            throw RequestFailed();
        }
    }

    private static ApiException UpstreamError(HttpStatusCode status) => status switch
    {
        HttpStatusCode.TooManyRequests => new(StatusCodes.Status429TooManyRequests, "rate_limited", "Az OpenRouter átmenetileg korlátozza a kéréseket."),
        HttpStatusCode.NotFound => new(StatusCodes.Status404NotFound, "model_unavailable", "A beállított AI-modell jelenleg nem érhető el."),
        _ => RequestFailed(),
    };

    private static ApiException RequestFailed() =>
        new(StatusCodes.Status502BadGateway, "upstream_error", "Az OpenRouter-kérés sikertelen volt. Próbáld később újra.");

    // choices[0].message.content, which must be a string.
    private static string ContentOf(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array && choices.GetArrayLength() > 0
                && choices[0] is { ValueKind: JsonValueKind.Object } choice
                && choice.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.Object
                && message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String)
            {
                return content.GetString()!;
            }
        }
        catch (JsonException)
        {
            throw RequestFailed();
        }
        throw new ApiException(StatusCodes.Status502BadGateway, "invalid_upstream_response", "Az OpenRouter válasza hiányos.");
    }
}
