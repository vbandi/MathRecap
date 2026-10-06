using System.Text;
using System.Text.Json;

namespace MathRecap.Api;

// Reads JSON request bodies. Other content types are rejected, which also keeps cross-site form posts out.
public static class JsonRequests
{
    public const int MaxBodyBytes = 64 * 1024;

    public static async Task<string> ReadTextAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        if (request.ContentType?.Split(';')[0].Trim().Equals("application/json", StringComparison.OrdinalIgnoreCase) != true)
        {
            throw new ApiException(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "A kérés törzsének JSON-nak kell lennie.");
        }

        var buffer = new byte[MaxBodyBytes + 1];
        var length = 0;
        int read;
        while (length < buffer.Length && (read = await request.Body.ReadAsync(buffer.AsMemory(length), cancellationToken)) > 0) length += read;
        if (length > MaxBodyBytes) throw new ApiException(StatusCodes.Status413PayloadTooLarge, "payload_too_large", "A kérés túl nagy.");
        return Encoding.UTF8.GetString(buffer, 0, length);
    }

    // The body as T, with camelCase property names.
    public static async Task<T> ReadAsync<T>(HttpRequest request, CancellationToken cancellationToken) where T : class
    {
        var text = await ReadTextAsync(request, cancellationToken);
        try
        {
            return JsonSerializer.Deserialize<T>(text, JsonSerializerOptions.Web) ?? throw InvalidJson();
        }
        catch (JsonException)
        {
            throw InvalidJson();
        }
    }

    public static ApiException InvalidJson() => new(StatusCodes.Status400BadRequest, "invalid_json", "A kérés törzse érvénytelen JSON.");
}
