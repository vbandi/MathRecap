using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using MathRecap.Api.Ai;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Learners;

public sealed record UsefulnessResponse(UsefulnessAnswer Usefulness);

public sealed record UsefulnessAnswer(string Text);

public static class UsefulnessEndpoints
{
    // POST /api/usefulness: the "why it is useful for you" text of a skill, written for the learner's
    // profile. The text is stored, and served again until the profile changes or a new one is asked for.
    public static void MapUsefulnessEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/usefulness", async (HttpRequest request, ClaimsPrincipal principal, Curriculum curriculum, AppDbContext db, ContentGenerator generator, TimeProvider time, CancellationToken cancellationToken) =>
        {
            var body = await RequestBodies.ReadUsefulnessRequestAsync(request, curriculum, cancellationToken);
            var user = await LearnerEndpoints.CurrentUserAsync(principal, db, cancellationToken);
            var fingerprint = FingerprintOf(user.Profile);
            var skillId = body.Skill.Id;
            if (!body.Refresh)
            {
                var stored = await db.UsefulnessTexts.AsNoTracking().SingleOrDefaultAsync(text => text.UserId == user.Id && text.SkillId == skillId, cancellationToken);
                if (stored is not null && stored.ProfileFingerprint.SequenceEqual(fingerprint)) return new UsefulnessResponse(new(stored.Text));
            }

            var generated = await generator.GenerateUsefulnessAsync(user.Profile, body.Skill, cancellationToken);
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

    // Identifies the profile a text was written for.
    private static byte[] FingerprintOf(Profile profile) => SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(profile, JavaScriptText.JsonOptions));
}
