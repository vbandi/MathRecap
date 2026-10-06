namespace MathRecap.Api;

public static class ApiEndpoints
{
    public static void MapApiEndpoints(this WebApplication app)
    {
        app.Map("/api/{**path}", () => ApiErrors.Create(StatusCodes.Status404NotFound, "not_found", "Az API-végpont nem található."));
    }
}
