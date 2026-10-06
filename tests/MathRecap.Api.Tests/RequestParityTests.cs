using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.AspNetCore.Http;

namespace MathRecap.Api.Tests;

// tests/fixtures/requests.json records what the previous zod request validation (without the removed
// modelId field) did with each body. The C# validation must agree on every case.
public sealed class RequestParityTests
{
    private const string RequestCases = "requests.json";
    private static readonly Curriculum Curriculum = TestCurriculum.Load();

    public static TheoryData<string> CaseNames => Fixtures.CaseNames(RequestCases);

    [Theory]
    [MemberData(nameof(CaseNames))]
    public async Task RequestOutcomeMatchesZod(string name)
    {
        var entry = Fixtures.Case(RequestCases, name);
        var request = JsonRequest(Fixtures.InputJson(entry));

        var read = (string)entry["endpoint"]! == "worksheets"
            ? ReadWorksheetRequest(request)
            : ReadUsefulnessRequest(request);

        if (entry["invalid"] is null)
        {
            var normalized = await read;
            Assert.True(JsonNode.DeepEquals(entry["expected"], normalized), $"Normalized request differs: {normalized.ToJsonString()}");
            return;
        }
        var error = await Assert.ThrowsAsync<ApiException>(() => read);
        Assert.Equal("invalid_request", error.Error.Code);
        Assert.Equal("A kérés nem felel meg az elvárt formátumnak.", error.Error.Message);
        var zodIssuePaths = entry["issues"]!.AsArray().Select(issue => (string)issue!["path"]!).ToList();
        Assert.Contains(zodIssuePaths[0], error.Error.Details!.Select(issue => issue.Path));
        if (zodIssuePaths.Distinct().Count() == 1) Assert.All(error.Error.Details!, issue => Assert.Equal(zodIssuePaths[0], issue.Path));
    }

    private static async Task<JsonNode> ReadWorksheetRequest(HttpRequest request)
    {
        var read = await GenerationRequests.ReadWorksheetRequestAsync(request, Curriculum, TestContext.Current.CancellationToken);
        return new JsonObject { ["profile"] = ProfileJson(read.Profile), ["request"] = read.Request, ["skillId"] = read.Skill.Id };
    }

    private static async Task<JsonNode> ReadUsefulnessRequest(HttpRequest request)
    {
        var read = await GenerationRequests.ReadUsefulnessRequestAsync(request, Curriculum, TestContext.Current.CancellationToken);
        return new JsonObject { ["profile"] = ProfileJson(read.Profile), ["skillId"] = read.Skill.Id };
    }

    private static JsonNode ProfileJson(Profile profile) => JsonSerializer.SerializeToNode(profile, JsonSerializerOptions.Web)!;

    private static HttpRequest JsonRequest(string body)
    {
        var context = new DefaultHttpContext();
        context.Request.ContentType = "application/json";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        return context.Request;
    }
}
