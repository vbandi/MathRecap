using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using MathRecap.Api.Ai;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Learners;

// Usefulness is null when there is no text for the learner's current profile.
public sealed record UsefulnessResponse(UsefulnessAnswer? Usefulness);

public sealed record UsefulnessAnswer(string Text);

public static class UsefulnessEndpoints
{
    // /api/usefulness: the "why it is useful for you" text of a skill, written for the learner's profile.
    // The text is stored, and served again until the profile changes or a new one is asked for.
    public static void MapUsefulnessEndpoints(this RouteGroupBuilder api)
    {
        // The stored text, if it was written for the current profile. Never asks the model.
        api.MapGet("/usefulness/{skillId}", async (string skillId, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var skill = RequestBodies.SkillOf(curriculum, skillId);
            var user = await LearnerEndpoints.CurrentUserAsync(principal, db, cancellationToken);
            var stored = await StoredTextAsync(db, user, skill.Id, cancellationToken);
            return new UsefulnessResponse(stored is null ? null : new(stored));
        });
        // The stored text, or a new one when there is none for the current profile or refresh is asked for.
        api.MapPost("/usefulness", async (HttpRequest request, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, ContentGenerator generator, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var body = await RequestBodies.ReadUsefulnessRequestAsync(request, curriculum, cancellationToken);
            var user = await LearnerEndpoints.CurrentUserAsync(principal, db, cancellationToken);
            var skillId = body.Skill.Id;
            if (!body.Refresh && await StoredTextAsync(db, user, skillId, cancellationToken) is { } stored) return new UsefulnessResponse(new(stored));

            var generated = await generator.GenerateUsefulnessAsync(user.Profile, body.Skill, cancellationToken);
            var fingerprint = FingerprintOf(user.Profile);
            await db.UpsertAsync(async () =>
            {
                var row = await db.UsefulnessTexts.SingleOrDefaultAsync(text => text.UserId == user.Id && text.SkillId == skillId, cancellationToken);
                if (row is null) db.UsefulnessTexts.Add(row = new UsefulnessText { UserId = user.Id, SkillId = skillId, Text = generated, ProfileFingerprint = fingerprint });
                row.Text = generated;
                row.ProfileFingerprint = fingerprint;
                row.CreatedAt = time.GetUtcNow();
            }, cancellationToken);
            return new UsefulnessResponse(new(generated));
        });
    }

    // The learner's stored text of the skill, unless it was written for another profile.
    private static async Task<string?> StoredTextAsync(AppDbContext db, User user, string skillId, CancellationToken cancellationToken)
    {
        var stored = await db.UsefulnessTexts.AsNoTracking().SingleOrDefaultAsync(text => text.UserId == user.Id && text.SkillId == skillId, cancellationToken);
        return stored is not null && stored.ProfileFingerprint.SequenceEqual(FingerprintOf(user.Profile)) ? stored.Text : null;
    }

    // Identifies the profile a text was written for.
    private static byte[] FingerprintOf(Profile profile) => SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(profile, JavaScriptText.JsonOptions));
}
