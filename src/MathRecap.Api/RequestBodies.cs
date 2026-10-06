using System.Text.Json;
using System.Text.Json.Nodes;

namespace MathRecap.Api;

public sealed record Profile(string Interests, string Background, string Goal);

public sealed record WorksheetRequest(Skill Skill, string Request);

public sealed record UsefulnessRequest(Skill Skill, bool Refresh);

public sealed record IllustrationReviewRequest(string Status, string Note);

// Reads the JSON request bodies. Their formats are in RequestSchemas/; skill IDs must exist in the
// curriculum.
public static class RequestBodies
{
    private static readonly JsonContract WorksheetFormat = JsonContract.Load("worksheet-request.schema.json");
    private static readonly JsonContract UsefulnessFormat = JsonContract.Load("usefulness-request.schema.json");
    private static readonly JsonContract ProfileFormat = JsonContract.Load("profile-request.schema.json");
    private static readonly JsonContract LevelsFormat = JsonContract.Load("levels-request.schema.json");
    private static readonly JsonContract IllustrationReviewFormat = JsonContract.Load("illustration-review-request.schema.json");

    public static async Task<WorksheetRequest> ReadWorksheetRequestAsync(HttpRequest request, Curriculum curriculum, CancellationToken cancellationToken)
    {
        var body = await ReadAsync(request, WorksheetFormat, body => UnknownSkill(curriculum, body, "skillId"), cancellationToken);
        return new WorksheetRequest(curriculum.Find(Text(body["skillId"]))!, Text(body["request"]));
    }

    public static async Task<UsefulnessRequest> ReadUsefulnessRequestAsync(HttpRequest request, Curriculum curriculum, CancellationToken cancellationToken)
    {
        var body = await ReadAsync(request, UsefulnessFormat, body => UnknownSkill(curriculum, body, "skillId"), cancellationToken);
        return new UsefulnessRequest(curriculum.Find(Text(body["skillId"]))!, body["refresh"]?.GetValue<bool>() ?? false);
    }

    // Missing texts are empty.
    public static async Task<Profile> ReadProfileAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        var body = await ReadAsync(request, ProfileFormat, _ => [], cancellationToken);
        string Optional(string name) => body[name] is { } value ? Text(value) : "";
        return new Profile(Optional("interests"), Optional("background"), Optional("goal"));
    }

    // Skill ID -> level 0-4.
    public static async Task<IReadOnlyDictionary<string, int>> ReadLevelsRequestAsync(HttpRequest request, Curriculum curriculum, CancellationToken cancellationToken)
    {
        var body = await ReadAsync(request, LevelsFormat, body => body["levels"] is JsonObject levels
            ? levels.Where(level => curriculum.Find(level.Key) is null).Select(level => new ValidationIssue($"levels.{level.Key}", "Unknown skill ID"))
            : [], cancellationToken);
        return body["levels"]!.AsObject().ToDictionary(level => level.Key, level => (int)level.Value!.GetValue<double>());
    }

    public static async Task<IllustrationReviewRequest> ReadIllustrationReviewRequestAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        var body = await ReadAsync(request, IllustrationReviewFormat, _ => [], cancellationToken);
        return new IllustrationReviewRequest(Text(body["status"]), Text(body["note"]));
    }

    // A skill ID from the URL (query string or route), reported like one in a body.
    public static Skill SkillOf(Curriculum curriculum, string? skillId) =>
        (skillId is null ? null : curriculum.Find(skillId)) ?? throw Invalid([new ValidationIssue("skillId", "Unknown skill ID")]);

    private static async Task<JsonObject> ReadAsync(HttpRequest request, JsonContract format, Func<JsonObject, IEnumerable<ValidationIssue>> check, CancellationToken cancellationToken)
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
        if (body is JsonObject value) issues.AddRange(check(value));
        if (issues.Count > 0) throw Invalid(issues);
        return body!.AsObject();
    }

    private static IEnumerable<ValidationIssue> UnknownSkill(Curriculum curriculum, JsonObject body, string name) =>
        body[name] is JsonValue value && value.TryGetValue<string>(out var skillId) && curriculum.Find(skillId) is null
            ? [new ValidationIssue(name, "Unknown skill ID")]
            : [];

    private static ApiException Invalid(IReadOnlyList<ValidationIssue> issues) =>
        new(StatusCodes.Status400BadRequest, "invalid_request", "A kérés nem felel meg az elvárt formátumnak.", issues);

    private static string Text(JsonNode? node) => node!.GetValue<string>();
}
