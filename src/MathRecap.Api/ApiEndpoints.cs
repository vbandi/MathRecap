using System.Text.Json.Nodes;
using MathRecap.Api.Accounts;
using MathRecap.Api.Ai;
using MathRecap.Api.Dev;

namespace MathRecap.Api;

public sealed record WorksheetResponse(JsonNode Worksheet);

public sealed record UsefulnessResponse(JsonNode Usefulness);

public static class ApiEndpoints
{
    // Every API endpoint needs a session, unless it is mapped with AllowAnonymous: the sign-in endpoints
    // in AccountEndpoints, the dev tools, and the answer to unknown routes. Pages: see PageAccess.
    public static void MapApiEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api").RequireAuthorization().AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            try
            {
                return await next(context);
            }
            catch (ApiException error)
            {
                return ApiErrors.Create(error.StatusCode, error.Error);
            }
        });

        api.MapPost("/worksheets", async (HttpRequest request, Curriculum curriculum, ContentGenerator generator, CancellationToken cancellationToken) =>
        {
            var worksheetRequest = await GenerationRequests.ReadWorksheetRequestAsync(request, curriculum, cancellationToken);
            return new WorksheetResponse(await generator.GenerateWorksheetAsync(worksheetRequest, cancellationToken));
        });
        api.MapPost("/usefulness", async (HttpRequest request, Curriculum curriculum, ContentGenerator generator, CancellationToken cancellationToken) =>
        {
            var usefulnessRequest = await GenerationRequests.ReadUsefulnessRequestAsync(request, curriculum, cancellationToken);
            return new UsefulnessResponse(await generator.GenerateUsefulnessAsync(usefulnessRequest, cancellationToken));
        });
        api.MapAccountEndpoints();
        app.MapDevTools(api);
        api.Map("/{**path}", () => ApiErrors.Create(StatusCodes.Status404NotFound, "not_found", "Az API-végpont nem található.")).AllowAnonymous();
    }
}
