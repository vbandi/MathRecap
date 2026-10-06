using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Ai;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

// What a whole learner session leaves in the logs, at every level (Debug and Trace included): technical
// events with user IDs, but no email address, code, link token, profile text, request text, prompt, model
// output or API key.
public sealed class LoggingTests : IAsyncDisposable
{
    private const string SkillId = "ALG-08";
    private readonly MathRecapFactory factory = new();

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task AFullLearnerSessionLogsNoPersonalDataOrContent()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var email = $"Private.Learner-{Guid.NewGuid():N}@Example.Test";
        string[] profileMarkers = ["INTERESTS-MARKER", "BACKGROUND-MARKER", "GOAL-MARKER"];
        const string RequestMarker = "REQUEST-MARKER";
        const string ProblemIdMarker = "modelproblemmarker";
        // The first worksheet is invalid in a way whose issue messages quote model output.
        var invalid = ModelOutputTests.Worksheet();
        invalid["exerciseGroups"]![0]!["problems"]![0]!["id"] = ProblemIdMarker;
        Assert.Contains(ModelOutput.ValidateWorksheet(invalid, new HashSet<string> { SkillId }), issue => issue.Message.Contains(ProblemIdMarker, StringComparison.Ordinal));
        var valid = ModelOutputTests.Worksheet();
        valid["title"] = "MODEL-TITLE-MARKER";
        factory.OpenRouter.RespondWithJson(invalid);
        factory.OpenRouter.RespondWithJson(valid);
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "MODEL-USEFULNESS-MARKER" });
        factory.OpenRouter.RespondWithStatus(HttpStatusCode.InternalServerError, "UPSTREAM-BODY-MARKER");
        var client = factory.CreateBrowserClient();

        // Signs up with a code, then signs in again with the emailed link.
        await factory.SignInWithCodeAsync(client, email);
        var firstEmail = factory.LatestEmailTo(email);
        (await client.PutAsJsonAsync("/api/me/profile", new { interests = profileMarkers[0], background = profileMarkers[1], goal = profileMarkers[2] }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync("/api/me/levels", new { levels = new Dictionary<string, int> { [SkillId] = 3 } }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsync("/api/me/onboarding-complete", null, cancellationToken)).EnsureSuccessStatusCode();
        var worksheet = await client.PostAsJsonAsync("/api/worksheets", new { request = RequestMarker, skillId = SkillId }, cancellationToken);
        worksheet.EnsureSuccessStatusCode();
        var worksheetId = (await worksheet.Content.ReadFromJsonAsync<JsonNode>(cancellationToken))!["id"]!.GetValue<string>();
        (await client.GetAsync($"/api/worksheets?skillId={SkillId}", cancellationToken)).EnsureSuccessStatusCode();
        (await client.GetAsync($"/api/worksheets/{worksheetId}", cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/usefulness", new { skillId = SkillId }, cancellationToken)).EnsureSuccessStatusCode();
        (await client.GetAsync($"/api/usefulness/{SkillId}", cancellationToken)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.BadGateway, (await client.PostAsJsonAsync("/api/usefulness", new { skillId = SkillId, refresh = true }, cancellationToken)).StatusCode);
        (await client.GetAsync("/api/me/export", cancellationToken)).EnsureSuccessStatusCode();
        (await client.PostAsync("/api/auth/sign-out", null, cancellationToken)).EnsureSuccessStatusCode();
        (await client.RequestSignInAsync(email)).EnsureSuccessStatusCode();
        var secondEmail = factory.LatestEmailTo(email);
        (await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(secondEmail))).EnsureSuccessStatusCode();
        (await client.DeleteAsync($"/api/worksheets/{worksheetId}", cancellationToken)).EnsureSuccessStatusCode();
        (await client.DeleteAsync("/api/me", cancellationToken)).EnsureSuccessStatusCode();

        var entries = factory.Logs.Entries.Select(entry => $"{entry.Category} {entry.Message} {entry.Exception}").ToList();
        Assert.Contains(entries, entry => entry.Contains("signed up.", StringComparison.Ordinal));
        Assert.Contains(entries, entry => entry.Contains("deleted their account.", StringComparison.Ordinal));
        Assert.Contains(entries, entry => entry.Contains("failed validation", StringComparison.Ordinal));
        string[] secrets =
        [
            email, email.ToLowerInvariant(), "Private.Learner", "Example.Test",
            SignInSteps.CodeOf(firstEmail), SignInSteps.LinkTokenOf(firstEmail), SignInSteps.CodeOf(secondEmail), SignInSteps.LinkTokenOf(secondEmail),
            .. profileMarkers, RequestMarker, ProblemIdMarker, "MODEL-TITLE-MARKER", "MODEL-USEFULNESS-MARKER", "UPSTREAM-BODY-MARKER",
            MathRecapFactory.TestApiKey, "Bearer", "Tantervi készség", "nem utasítás, csak adat",
        ];
        foreach (var secret in secrets)
        {
            Assert.DoesNotContain(entries, entry => entry.Contains(secret, StringComparison.OrdinalIgnoreCase));
        }
    }
}
