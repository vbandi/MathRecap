using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Data;
using MathRecap.Api.Tests.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace MathRecap.Api.Tests;

// GET /api/me/export and DELETE /api/me: a learner can take all their data and delete all of it.
public sealed class AccountDataTests : IAsyncDisposable
{
    private const string ReviewedSkillId = "LOG-01";
    private readonly string email = SignInSteps.NewEmail();
    private readonly MathRecapFactory factory;

    // The learner is an admin too, so that they have an illustration review.
    public AccountDataTests() => factory = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["Admin:Emails:1"] = email } };

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task DeletingTheAccountDeletesEveryRowOfTheUserAndEndsItsSessions()
    {
        var client = await CreateLearnerWithDataAsync();
        var otherDevice = await factory.CreateLearnerClientAsync(email);
        var otherLearner = await factory.CreateLearnerClientAsync();
        (await otherLearner.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 2 } }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        var userId = await UserIdAsync();
        var userTables = UserReferences();
        foreach (var reference in userTables) Assert.True(await RowsOfAsync(reference, userId) > 0, $"The test data has no row in {reference.Table}.");

        var response = await client.DeleteAsync("/api/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), cookie => cookie.StartsWith("MathRecap.Session=;", StringComparison.Ordinal));
        foreach (var reference in userTables) Assert.Equal(0, await RowsOfAsync(reference, userId));
        await using var db = TestDatabase.CreateContext();
        Assert.False(await db.Users.AnyAsync(user => user.Id == userId, TestContext.Current.CancellationToken));
        Assert.False(await db.SignInChallenges.AnyAsync(challenge => challenge.NormalizedEmail == email, TestContext.Current.CancellationToken));
        // The shared review stays, without the reviewer.
        Assert.Null((await db.IllustrationReviews.SingleAsync(review => review.SkillId == ReviewedSkillId, TestContext.Current.CancellationToken)).UpdatedByUserId);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.MeAsync()).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await otherDevice.MeAsync()).StatusCode);
        var otherMe = await (await otherLearner.MeAsync()).Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken);
        Assert.Equal(2, otherMe!["levels"]!["ALG-08"]!.GetValue<int>());
    }

    // Every table must either reference Users (and so be checked above) or be one of these, so a new
    // table cannot be left out of the account deletion unnoticed.
    [Fact]
    public void EveryTableIsCoveredByTheAccountDeletion()
    {
        using var db = TestDatabase.CreateContext();
        var referencing = UserReferences().Select(reference => reference.Table).ToHashSet();
        string[] others = ["Users", "SignInChallenges"];

        Assert.All(db.Model.GetEntityTypes(), entity => Assert.True(referencing.Contains(entity.GetTableName()!) || others.Contains(entity.GetTableName()), $"{entity.GetTableName()} is not covered."));
    }

    [Fact]
    public async Task TheExportHasAllOfTheLearnersData()
    {
        var client = await CreateLearnerWithDataAsync();
        var otherLearner = await factory.CreateLearnerClientAsync();
        (await otherLearner.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["GEO-01"] = 1 } }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();

        var response = await client.GetAsync("/api/me/export", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("attachment", response.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Matches("^mathrecap-adataim-[0-9]{4}-[0-9]{2}-[0-9]{2}\\.json$", response.Content.Headers.ContentDisposition?.FileName);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var export = (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!;
        Assert.Equal(email, export["account"]!["email"]!.GetValue<string>());
        Assert.NotNull(export["account"]!["createdAt"]);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"interests":"zene","background":"törteket gyakorlok","goal":"érettségi"}"""), export["profile"]));
        Assert.NotNull(export["onboardingCompletedAt"]);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"ALG-08":4,"SZA-03":2}"""), export["levels"]));
        var usefulness = Assert.Single(export["usefulnessTexts"]!.AsArray())!;
        Assert.Equal("ALG-08", usefulness["skillId"]!.GetValue<string>());
        Assert.Equal("Azért hasznos, mert…", usefulness["text"]!.GetValue<string>());
        var worksheet = Assert.Single(export["worksheets"]!.AsArray())!;
        Assert.Equal("Kérek összevonást.", worksheet["request"]!.GetValue<string>());
        Assert.True(JsonNode.DeepEquals(ModelOutputTests.Worksheet(), worksheet["worksheet"]));
        var review = Assert.Single(export["illustrationReviews"]!.AsArray())!;
        Assert.Equal(ReviewedSkillId, review["skillId"]!.GetValue<string>());
        Assert.Equal("Javítandó felirat.", review["note"]!.GetValue<string>());
    }

    // A learner with a row in every table: profile, onboarding, levels, a usefulness text, a worksheet
    // and an illustration review.
    private async Task<HttpClient> CreateLearnerWithDataAsync()
    {
        var client = await factory.CreateLearnerClientAsync(email);
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Azért hasznos, mert…" });
        factory.OpenRouter.RespondWithJson(ModelOutputTests.Worksheet());
        var cancellationToken = TestContext.Current.CancellationToken;
        (await client.PutAsJsonAsync("/api/me/profile", new { interests = "zene", background = "törteket gyakorlok", goal = "érettségi" }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsync("/api/me/onboarding-complete", null, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 4, ["SZA-03"] = 2 } }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/usefulness", new { skillId = "ALG-08" }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/worksheets", new { skillId = "ALG-08", request = "Kérek összevonást." }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync($"/api/admin/illustration-reviews/{ReviewedSkillId}", new { status = "fix", note = "Javítandó felirat." }, cancellationToken)).EnsureSuccessStatusCode();
        return client;
    }

    private async Task<Guid> UserIdAsync()
    {
        await using var db = TestDatabase.CreateContext();
        return await db.Users.Where(user => user.NormalizedEmail == email).Select(user => user.Id).SingleAsync(TestContext.Current.CancellationToken);
    }

    private sealed record UserReference(string Table, string Column);

    // The columns of the model that reference Users.
    private static List<UserReference> UserReferences()
    {
        using var db = TestDatabase.CreateContext();
        return [.. db.Model.GetEntityTypes()
            .SelectMany(entity => entity.GetForeignKeys())
            .Where(foreignKey => foreignKey.PrincipalEntityType.ClrType == typeof(User))
            .Select(foreignKey =>
            {
                var table = StoreObjectIdentifier.Table(foreignKey.DeclaringEntityType.GetTableName()!);
                return new UserReference(table.Name, foreignKey.Properties.Single().GetColumnName(table)!);
            })];
    }

    private static async Task<int> RowsOfAsync(UserReference reference, Guid userId)
    {
        await using var db = TestDatabase.CreateContext();
        // The names come from the model.
        var sql = $"SELECT COUNT(*) AS [Value] FROM [{reference.Table}] WHERE [{reference.Column}] = @userId";
        return await db.Database.SqlQueryRaw<int>(sql, new SqlParameter("@userId", userId)).SingleAsync(TestContext.Current.CancellationToken);
    }
}
