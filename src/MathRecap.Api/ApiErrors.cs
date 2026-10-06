namespace MathRecap.Api;

public sealed record ApiError(string Code, string Message);

public sealed record ApiErrorResponse(ApiError Error);

public static class ApiErrors
{
    public static IResult Create(int statusCode, string code, string message) =>
        TypedResults.Json(new ApiErrorResponse(new ApiError(code, message)), statusCode: statusCode);
}
