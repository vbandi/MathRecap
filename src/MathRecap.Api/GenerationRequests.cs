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
        JsonNode? body;
        try
        {
            body = format.Parse(await JsonRequests.ReadTextAsync(request, cancellationToken));
        }
        catch (JsonException)
        {
            throw JsonRequests.InvalidJson();
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

    private static Profile ProfileOf(JsonObject body)
    {
        var profile = body["profile"]!.AsObject();
        string Text(string name) => profile[name]?.GetValue<string>() ?? "";
        return new Profile(Text("interests"), Text("background"), Text("goal"));
    }
}
