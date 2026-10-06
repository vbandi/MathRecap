using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Tests;

// GET /api/me and the learner's profile, skill levels and onboarding, each stored per account.
public sealed class LearnerDataTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Fact]
    public async Task ANewLearnerStartsWithNothing()
    {
        var email = SignInSteps.NewEmail();
        var client = await factory.CreateLearnerClientAsync(email);

        var me = await MeAsync(client);

        Assert.True(JsonNode.DeepEquals(
            JsonNode.Parse($$$"""{"email":"{{{email}}}","isAdmin":false,"profile":{"interests":"","background":"","goal":""},"onboardingComplete":false,"levels":{}}"""),
            me), me.ToJsonString());
    }

    [Fact]
    public async Task TheProfileIsStoredTrimmedAndReplacedAsAWhole()
    {
        var client = await factory.CreateLearnerClientAsync();

        var saved = await client.PutAsJsonAsync("/api/me/profile", new { interests = "  zene ", background = "törteket gyakorlok", goal = "érettségi\n" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"interests":"zene","background":"törteket gyakorlok","goal":"érettségi"}"""), (await MeAsync(client))["profile"]));

        (await client.PutAsJsonAsync("/api/me/profile", new { goal = "informatika szak" }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();

        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"interests":"","background":"","goal":"informatika szak"}"""), (await MeAsync(client))["profile"]));
    }

    [Fact]
    public async Task LevelsAreSetInBatchesAndLevelZeroRemovesTheRow()
    {
        var email = SignInSteps.NewEmail();
        var client = await factory.CreateLearnerClientAsync(email);

        var first = await client.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 4, ["SZA-03"] = 2, ["GEO-01"] = 0 } }, TestContext.Current.CancellationToken);
        var second = await client.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 0, ["SZA-03"] = 3, ["LOG-01"] = 1 } }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, second.StatusCode);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"LOG-01":1,"SZA-03":3}"""), (await MeAsync(client))["levels"]));
        await using var db = TestDatabase.CreateContext();
        var stored = await db.SkillLevels.Where(level => level.UserId == db.Users.Single(user => user.NormalizedEmail == email).Id)
            .OrderBy(level => level.SkillId).Select(level => level.SkillId).ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(["LOG-01", "SZA-03"], stored);
    }

    [Fact]
    public async Task OnboardingCompletionKeepsTheFirstTime()
    {
        var email = SignInSteps.NewEmail();
        var client = await factory.CreateLearnerClientAsync(email);

        var first = await client.PostAsync("/api/me/onboarding-complete", null, TestContext.Current.CancellationToken);
        var completedAt = await OnboardingCompletedAtAsync(email);
        var second = await client.PostAsync("/api/me/onboarding-complete", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, second.StatusCode);
        Assert.NotNull(completedAt);
        Assert.Equal(completedAt, await OnboardingCompletedAtAsync(email));
        Assert.True((await MeAsync(client))["onboardingComplete"]!.GetValue<bool>());
    }

    [Theory]
    [InlineData("/api/me/levels", """{"levels":{"ALG-08":2,"GEO-99":2}}""", "levels.GEO-99")]
    [InlineData("/api/me/levels", """{"levels":{"ALG-08":5}}""", "levels.ALG-08")]
    [InlineData("/api/me/levels", """{"levels":{"ALG-08":-1}}""", "levels.ALG-08")]
    [InlineData("/api/me/levels", """{"levels":{"ALG-08":2.5}}""", "levels.ALG-08")]
    [InlineData("/api/me/levels", """{"levels":{"ALG-08":2},"mastery":{}}""", "")]
    [InlineData("/api/me/levels", """{"ALG-08":2}""", "")]
    [InlineData("/api/me/profile", """{"interests":"zene","name":"Anna"}""", "")]
    [InlineData("/api/me/profile", """{"interests":5}""", "interests")]
    public async Task InvalidChangesAreRejectedAndChangeNothing(string path, string body, string issuePath)
    {
        var client = await factory.CreateLearnerClientAsync();

        var response = await client.PutAsync(path, new StringContent(body, Encoding.UTF8, "application/json"), TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_request");
        Assert.Equal("A kérés nem felel meg az elvárt formátumnak.", error["message"]!.GetValue<string>());
        Assert.Contains(issuePath, error["details"]!.AsArray().Select(issue => issue!["path"]!.GetValue<string>()));
        var me = await MeAsync(client);
        Assert.Empty(me["levels"]!.AsObject());
        Assert.Equal("", me["profile"]!["interests"]!.GetValue<string>());
    }

    [Fact]
    public async Task OversizedProfileTextsAreRejected()
    {
        var client = await factory.CreateLearnerClientAsync();

        var response = await client.PutAsJsonAsync("/api/me/profile", new { interests = "zene", goal = new string('a', 501) }, TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_request");
        Assert.Equal("goal", error["details"]![0]!["path"]!.GetValue<string>());
        Assert.Equal("", (await MeAsync(client))["profile"]!["interests"]!.GetValue<string>());
    }

    [Fact]
    public async Task ASecondLearnerCannotReadOrChangeTheFirstLearnersProfileOrLevels()
    {
        var first = await factory.CreateLearnerClientAsync();
        (await first.PutAsJsonAsync("/api/me/profile", new { interests = "zene", background = "", goal = "érettségi" }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        (await first.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 3 } }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        var firstBefore = await MeAsync(first);
        var secondEmail = SignInSteps.NewEmail();
        var second = await factory.CreateLearnerClientAsync(secondEmail);

        var secondView = await MeAsync(second);
        (await second.PutAsJsonAsync("/api/me/profile", new { interests = "sport" }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        (await second.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { ["ALG-08"] = 0, ["GEO-01"] = 4 } }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        (await second.PostAsync("/api/me/onboarding-complete", null, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();

        Assert.Equal(secondEmail, secondView["email"]!.GetValue<string>());
        Assert.Equal("", secondView["profile"]!["interests"]!.GetValue<string>());
        Assert.Empty(secondView["levels"]!.AsObject());
        Assert.True(JsonNode.DeepEquals(firstBefore, await MeAsync(first)));
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse("""{"GEO-01":4}"""), (await MeAsync(second))["levels"]));
    }

    private static async Task<JsonNode> MeAsync(HttpClient client)
    {
        var response = await client.MeAsync();
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!;
    }

    private static async Task<DateTimeOffset?> OnboardingCompletedAtAsync(string email)
    {
        await using var db = TestDatabase.CreateContext();
        return await db.Users.Where(user => user.NormalizedEmail == email).Select(user => user.OnboardingCompletedAt).SingleAsync(TestContext.Current.CancellationToken);
    }
}
