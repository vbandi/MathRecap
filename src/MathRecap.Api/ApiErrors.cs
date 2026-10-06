using System.Text.Json.Serialization;

namespace MathRecap.Api;

public sealed record ApiError(
    string Code,
    string Message,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyList<ValidationIssue>? Details = null);

public sealed record ApiErrorResponse(ApiError Error);

// An error the API reports to the client as { error: { code, message } }, with a Hungarian message.
public sealed class ApiException(int statusCode, string code, string message, IReadOnlyList<ValidationIssue>? details = null) : Exception(message)
{
    public int StatusCode => statusCode;

    public ApiError Error => new(code, Message, details);
}

public static class ApiErrors
{
    public static IResult Create(int statusCode, string code, string message) => Create(statusCode, new ApiError(code, message));

    public static IResult Create(int statusCode, ApiError error) => TypedResults.Json(new ApiErrorResponse(error), statusCode: statusCode);
}
