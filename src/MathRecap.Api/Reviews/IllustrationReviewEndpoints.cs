using System.Security.Claims;
using MathRecap.Api.Accounts;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Reviews;

// UpdatedBy is the email address of the admin who changed the review last, or null when that account
// was deleted.
public sealed record IllustrationReviewResponse(string Status, string Note, DateTimeOffset UpdatedAt, string? UpdatedBy);

public sealed record IllustrationReviewsResponse(IReadOnlyDictionary<string, IllustrationReviewResponse> Reviews);

// /api/admin/illustration-reviews: the admins' shared review of the skill illustrations (review.html).
// Skills without a review are still to do.
public static class IllustrationReviewEndpoints
{
    public static void MapIllustrationReviewEndpoints(this RouteGroupBuilder api)
    {
        var reviews = api.MapGroup("/admin/illustration-reviews").AddEndpointFilter(Admins.RequireAdminAsync);
        reviews.MapGet("", async (AppDbContext db, CancellationToken cancellationToken) =>
            new IllustrationReviewsResponse(await db.IllustrationReviews
                .Select(review => new { review.SkillId, Response = new IllustrationReviewResponse(review.Status, review.Note, review.UpdatedAt, review.UpdatedBy!.Email) })
                .ToDictionaryAsync(review => review.SkillId, review => review.Response, cancellationToken)));
        reviews.MapPut("/{skillId}", async (string skillId, HttpRequest request, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var skill = RequestBodies.SkillOf(curriculum, skillId);
            var body = await RequestBodies.ReadIllustrationReviewRequestAsync(request, cancellationToken);
            var userId = UserAccounts.UserIdOf(principal);
            var now = time.GetUtcNow();
            await db.UpsertAsync(async () =>
            {
                var review = await db.IllustrationReviews.SingleOrDefaultAsync(entry => entry.SkillId == skill.Id, cancellationToken);
                if (review is null) db.IllustrationReviews.Add(review = new IllustrationReview { SkillId = skill.Id, Status = body.Status, Note = body.Note });
                review.Status = body.Status;
                review.Note = body.Note;
                review.UpdatedAt = now;
                review.UpdatedByUserId = userId;
            }, cancellationToken);
            var email = await db.Users.Where(user => user.Id == userId).Select(user => user.Email).SingleAsync(cancellationToken);
            return new IllustrationReviewResponse(body.Status, body.Note, now, email);
        });
    }
}
