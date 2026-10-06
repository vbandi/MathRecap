using System.Security.Claims;
using System.Text.Json.Nodes;
using MathRecap.Api.Accounts;
using MathRecap.Api.Ai;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Learners;

public sealed record WorksheetResponse(Guid Id, string SkillId, string Title, string Request, DateTimeOffset CreatedAt, JsonNode Worksheet)
{
    public static WorksheetResponse Of(Worksheet worksheet) =>
        new(worksheet.Id, worksheet.SkillId, worksheet.Title, worksheet.Request, worksheet.CreatedAt, JsonNode.Parse(worksheet.Content)!);
}

public sealed record WorksheetSummary(Guid Id, string SkillId, string Title, string Request, DateTimeOffset CreatedAt);

public sealed record WorksheetListResponse(IReadOnlyList<WorksheetSummary> Worksheets);

// /api/worksheets: generating worksheets and the learner's saved ones. Another learner's worksheet is
// answered as missing, so its existence is not revealed.
public static class WorksheetEndpoints
{
    public static void MapWorksheetEndpoints(this RouteGroupBuilder api)
    {
        var worksheets = api.MapGroup("/worksheets");
        worksheets.MapPost("", async (HttpRequest request, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, ContentGenerator generator, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var worksheetRequest = await RequestBodies.ReadWorksheetRequestAsync(request, curriculum, cancellationToken);
            var user = await LearnerEndpoints.CurrentUserAsync(principal, db, cancellationToken);
            var content = await generator.GenerateWorksheetAsync(user.Profile, worksheetRequest, cancellationToken);
            var worksheet = new Worksheet
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                SkillId = worksheetRequest.Skill.Id,
                Title = content["title"]!.GetValue<string>(),
                Request = worksheetRequest.Request,
                Content = content.ToJsonString(JavaScriptText.JsonOptions),
                CreatedAt = time.GetUtcNow(),
            };
            db.Worksheets.Add(worksheet);
            await db.SaveChangesAsync(cancellationToken);
            return WorksheetResponse.Of(worksheet);
        });
        // Newest first; all skills' worksheets unless skillId is given.
        worksheets.MapGet("", async (string? skillId, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = UserAccounts.UserIdOf(principal);
            var query = db.Worksheets.Where(worksheet => worksheet.UserId == userId);
            if (skillId is not null)
            {
                var skill = RequestBodies.SkillOf(curriculum, skillId);
                query = query.Where(worksheet => worksheet.SkillId == skill.Id);
            }
            return new WorksheetListResponse(await query.OrderByDescending(worksheet => worksheet.CreatedAt)
                .Select(worksheet => new WorksheetSummary(worksheet.Id, worksheet.SkillId, worksheet.Title, worksheet.Request, worksheet.CreatedAt))
                .ToListAsync(cancellationToken));
        });
        worksheets.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = UserAccounts.UserIdOf(principal);
            var worksheet = await db.Worksheets.AsNoTracking().SingleOrDefaultAsync(worksheet => worksheet.Id == id && worksheet.UserId == userId, cancellationToken);
            return WorksheetResponse.Of(worksheet ?? throw NotFound());
        });
        worksheets.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = UserAccounts.UserIdOf(principal);
            var deleted = await db.Worksheets.Where(worksheet => worksheet.Id == id && worksheet.UserId == userId).ExecuteDeleteAsync(cancellationToken);
            return deleted > 0 ? TypedResults.NoContent() : throw NotFound();
        });
    }

    private static ApiException NotFound() => new(StatusCodes.Status404NotFound, "worksheet_not_found", "A feladatlap nem található.");
}
