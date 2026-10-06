using System.Text.Json.Nodes;
using MathRecap.Api.Ai;

namespace MathRecap.Api;

public sealed record WorksheetResponse(JsonNode Worksheet);

public sealed record UsefulnessResponse(JsonNode Usefulness);

public static class ApiEndpoints
{
    public static void MapApiEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api").AddEndpointFilter(async (context, next) =>
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
        api.Map("/{**path}", () => ApiErrors.Create(StatusCodes.Status404NotFound, "not_found", "Az API-végpont nem található."));
    }
}
