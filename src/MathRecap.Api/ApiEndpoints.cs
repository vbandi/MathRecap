using MathRecap.Api.Accounts;
using MathRecap.Api.Dev;
using MathRecap.Api.Learners;
using MathRecap.Api.Reviews;

namespace MathRecap.Api;

public static class ApiEndpoints
{
    // Every API endpoint needs a session, unless it is mapped with AllowAnonymous: the sign-in endpoints
    // in AccountEndpoints, the dev tools, and the answer to unknown routes. Admin endpoints also need an
    // admin (see Admins). Pages: see PageAccess.
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

        api.MapLearnerEndpoints();
        api.MapUsefulnessEndpoints();
        api.MapWorksheetEndpoints();
        api.MapIllustrationReviewEndpoints();
        api.MapAccountEndpoints();
        app.MapDevTools(api);
        api.Map("/{**path}", () => ApiErrors.Create(StatusCodes.Status404NotFound, "not_found", "Az API-végpont nem található.")).AllowAnonymous();
    }
}
