using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MathRecap.Api;

public sealed record Profile(string Interests, string Background, string Goal);

public sealed record WorksheetRequest(Profile Profile, string Request, Skill Skill);

public sealed record UsefulnessRequest(Profile Profile, Skill Skill);

// Reads the JSON bodies of POST /api/worksheets and /api/usefulness. Their formats are in
// RequestSchemas/; the skill must exist in the curriculum.
public static class GenerationRequests
{
    public const int MaxBodyBytes = 64 * 1024;

    private static readonly JsonContract WorksheetFormat = JsonContract.Load("worksheet-request.schema.json");
    private static readonly JsonContract UsefulnessFormat = JsonContract.Load("usefulness-request.schema.json");

    public static async Task<WorksheetRequest> ReadWorksheetRequestAsync(HttpRequest request, Curriculum curriculum, CancellationToken cancellationToken)
    {
        var (body, skill) = await ReadAsync(request, WorksheetFormat, curriculum, cancellationToken);
        return new WorksheetRequest(ProfileOf(body), body["request"]!.GetValue<string>(), skill);
    }

    public static async Task<UsefulnessRequest> ReadUsefulnessRequestAsync(HttpRequest request, Curriculum curriculum, CancellationToken cancellationToken)
    {
        var (body, skill) = await ReadAsync(request, UsefulnessFormat, curriculum, cancellationToken);
        return new UsefulnessRequest(ProfileOf(body), skill);
    }

    private static async Task<(JsonObject Body, Skill Skill)> ReadAsync(HttpRequest request, JsonContract format, Curriculum curriculum, CancellationToken cancellationToken)
    {
        if (request.ContentType?.Split(';')[0].Trim().Equals("application/json", StringComparison.OrdinalIgnoreCase) != true)
        {
            throw new ApiException(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "A kérés törzsének JSON-nak kell lennie.");
        }

        JsonNode? body;
        try
        {
            body = format.Parse(await ReadTextAsync(request.Body, cancellationToken));
        }
        catch (JsonException)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "invalid_json", "A kérés törzse érvénytelen JSON.");
        }

        var issues = format.Validate(body).ToList();
        var skillId = (body as JsonObject)?["skillId"] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
        var skill = skillId is null ? null : curriculum.Find(skillId);
        if (skillId is not null && skill is null) issues.Add(new ValidationIssue("skillId", "Unknown skill ID"));
        if (issues.Count > 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "invalid_request", "A kérés nem felel meg az elvárt formátumnak.", issues);
        }
        return (body!.AsObject(), skill!);
    }

    private static async Task<string> ReadTextAsync(Stream body, CancellationToken cancellationToken)
    {
        var buffer = new byte[MaxBodyBytes + 1];
        var length = 0;
        int read;
        while (length < buffer.Length && (read = await body.ReadAsync(buffer.AsMemory(length), cancellationToken)) > 0) length += read;
        if (length > MaxBodyBytes) throw new ApiException(StatusCodes.Status413PayloadTooLarge, "payload_too_large", "A kérés túl nagy.");
        return Encoding.UTF8.GetString(buffer, 0, length);
    }

    private static Profile ProfileOf(JsonObject body)
    {
        var profile = body["profile"]!.AsObject();
        string Text(string name) => profile[name]?.GetValue<string>() ?? "";
        return new Profile(Text("interests"), Text("background"), Text("goal"));
    }
}
