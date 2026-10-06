using Microsoft.AspNetCore.Authentication;

namespace MathRecap.Api.Accounts;

public sealed record SignInRequest(string? Email);

public sealed record VerifyCodeRequest(string? Email, string? Code);

public sealed record VerifyLinkRequest(string? Token);

public sealed record AccountResponse(string Email);

public static class AccountEndpoints
{
    // /api/auth/*. Requesting and verifying a code or link needs no session; signing out does. The account
    // itself is under /api/me (see LearnerEndpoints).
    public static void MapAccountEndpoints(this RouteGroupBuilder api)
    {
        var auth = api.MapGroup("/auth");
        auth.MapPost("/sign-in", async (HttpRequest request, SignInChallenges challenges, CancellationToken cancellationToken) =>
        {
            var body = await JsonRequests.ReadAsync<SignInRequest>(request, cancellationToken);
            await challenges.SendAsync(EmailAddress.Parse(body.Email), cancellationToken);
            return TypedResults.NoContent();
        }).AllowAnonymous().RequireRateLimiting(RateLimits.SignInPolicy);
        auth.MapPost("/verify-code", async (HttpContext context, SignInChallenges challenges, UserAccounts users, CancellationToken cancellationToken) =>
        {
            var body = await JsonRequests.ReadAsync<VerifyCodeRequest>(context.Request, cancellationToken);
            var email = await challenges.VerifyCodeAsync(EmailAddress.Parse(body.Email), body.Code, cancellationToken);
            return new AccountResponse((await users.SignInAsync(context, email, cancellationToken)).Email);
        }).AllowAnonymous().RequireRateLimiting(RateLimits.VerifyPolicy);
        auth.MapPost("/verify-link", async (HttpContext context, SignInChallenges challenges, UserAccounts users, CancellationToken cancellationToken) =>
        {
            var body = await JsonRequests.ReadAsync<VerifyLinkRequest>(context.Request, cancellationToken);
            var email = await challenges.VerifyLinkAsync(body.Token, cancellationToken);
            return new AccountResponse((await users.SignInAsync(context, email, cancellationToken)).Email);
        }).AllowAnonymous().RequireRateLimiting(RateLimits.VerifyPolicy);
        auth.MapPost("/sign-out", async (HttpContext context) =>
        {
            await context.SignOutAsync();
            return TypedResults.NoContent();
        });
    }
}
