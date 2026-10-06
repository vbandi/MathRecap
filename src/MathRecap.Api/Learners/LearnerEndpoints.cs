using System.Security.Claims;
using System.Text.Json;
using MathRecap.Api.Accounts;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Learners;

public sealed record MeResponse(string Email, bool IsAdmin, Profile Profile, bool OnboardingComplete, IReadOnlyDictionary<string, int> Levels);

public sealed record ExportResponse(
    DateTimeOffset ExportedAt,
    ExportedAccount Account,
    Profile Profile,
    DateTimeOffset? OnboardingCompletedAt,
    IReadOnlyDictionary<string, int> Levels,
    IReadOnlyList<ExportedUsefulnessText> UsefulnessTexts,
    IReadOnlyList<WorksheetResponse> Worksheets,
    IReadOnlyList<ExportedIllustrationReview> IllustrationReviews);

public sealed record ExportedAccount(string Email, DateTimeOffset CreatedAt, DateTimeOffset? LastSignInAt);

public sealed record ExportedUsefulnessText(string SkillId, string Text, DateTimeOffset CreatedAt);

public sealed record ExportedIllustrationReview(string SkillId, string Status, string Note, DateTimeOffset UpdatedAt);

// /api/me/*: the signed-in learner's account, profile and skill levels.
public static class LearnerEndpoints
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new(JavaScriptText.JsonOptions) { WriteIndented = true };

    public static void MapLearnerEndpoints(this RouteGroupBuilder api)
    {
        var me = api.MapGroup("/me");
        // Everything a page needs to start; levels at 0 are left out.
        me.MapGet("", async (ClaimsPrincipal principal, AppDbContext db, Admins admins, CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserAsync(principal, db, cancellationToken);
            return new MeResponse(user.Email, admins.IsAdmin(user), user.Profile, user.OnboardingCompletedAt is not null, await LevelsAsync(db, user.Id, cancellationToken));
        });
        me.MapPut("/profile", async (HttpRequest request, ClaimsPrincipal principal, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var profile = await RequestBodies.ReadProfileAsync(request, cancellationToken);
            var userId = UserAccounts.UserIdOf(principal);
            await db.Users.Where(user => user.Id == userId).ExecuteUpdateAsync(setters => setters
                .SetProperty(user => user.Interests, profile.Interests)
                .SetProperty(user => user.Background, profile.Background)
                .SetProperty(user => user.Goal, profile.Goal), cancellationToken);
            return TypedResults.NoContent();
        });
        // Sets the given skills' levels; the others keep theirs.
        me.MapPut("/levels", async (HttpRequest request, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var levels = await RequestBodies.ReadLevelsRequestAsync(request, curriculum, cancellationToken);
            var userId = UserAccounts.UserIdOf(principal);
            await db.UpsertAsync(async () =>
            {
                var stored = await db.SkillLevels.Where(level => level.UserId == userId).ToDictionaryAsync(level => level.SkillId, cancellationToken);
                foreach (var (skillId, level) in levels)
                {
                    var row = stored.GetValueOrDefault(skillId);
                    if (level == 0)
                    {
                        if (row is not null) db.SkillLevels.Remove(row);
                    }
                    else if (row is null) db.SkillLevels.Add(new SkillLevel { UserId = userId, SkillId = skillId, Level = level });
                    else row.Level = level;
                }
            }, cancellationToken);
            return TypedResults.NoContent();
        });
        // Keeps the time of the first completion.
        me.MapPost("/onboarding-complete", async (ClaimsPrincipal principal, AppDbContext db, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var userId = UserAccounts.UserIdOf(principal);
            var now = time.GetUtcNow();
            await db.Users.Where(user => user.Id == userId && user.OnboardingCompletedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(user => user.OnboardingCompletedAt, now), cancellationToken);
            return TypedResults.NoContent();
        });
        me.MapGet("/export", async (ClaimsPrincipal principal, AppDbContext db, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserAsync(principal, db, cancellationToken);
            var now = time.GetUtcNow();
            var export = new ExportResponse(
                now,
                new ExportedAccount(user.Email, user.CreatedAt, user.LastSignInAt),
                user.Profile,
                user.OnboardingCompletedAt,
                await LevelsAsync(db, user.Id, cancellationToken),
                await db.UsefulnessTexts.Where(text => text.UserId == user.Id).OrderBy(text => text.SkillId)
                    .Select(text => new ExportedUsefulnessText(text.SkillId, text.Text, text.CreatedAt)).ToListAsync(cancellationToken),
                [.. (await db.Worksheets.AsNoTracking().Where(worksheet => worksheet.UserId == user.Id).OrderByDescending(worksheet => worksheet.CreatedAt).ToListAsync(cancellationToken))
                    .Select(WorksheetResponse.Of)],
                await db.IllustrationReviews.Where(review => review.UpdatedByUserId == user.Id).OrderBy(review => review.SkillId)
                    .Select(review => new ExportedIllustrationReview(review.SkillId, review.Status, review.Note, review.UpdatedAt)).ToListAsync(cancellationToken));
            return TypedResults.File(JsonSerializer.SerializeToUtf8Bytes(export, ExportJsonOptions), "application/json; charset=utf-8", $"mathrecap-adataim-{now:yyyy-MM-dd}.json");
        });
        me.MapDelete("", async (HttpContext context, UserAccounts users, CancellationToken cancellationToken) =>
        {
            await users.DeleteAsync(context, cancellationToken);
            return TypedResults.NoContent();
        });
    }

    public static Task<User> CurrentUserAsync(ClaimsPrincipal principal, AppDbContext db, CancellationToken cancellationToken)
    {
        var userId = UserAccounts.UserIdOf(principal);
        return db.Users.AsNoTracking().SingleAsync(user => user.Id == userId, cancellationToken);
    }

    private static async Task<IReadOnlyDictionary<string, int>> LevelsAsync(AppDbContext db, Guid userId, CancellationToken cancellationToken) =>
        await db.SkillLevels.Where(level => level.UserId == userId).OrderBy(level => level.SkillId).ToDictionaryAsync(level => level.SkillId, level => level.Level, cancellationToken);
}
