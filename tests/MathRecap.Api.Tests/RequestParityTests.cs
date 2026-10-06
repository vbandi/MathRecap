using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.AspNetCore.Http;

namespace MathRecap.Api.Tests;

// tests/fixtures/requests.json lists request bodies and how they are read: the normalized request, or
// the issues of an invalid one. Its generation and profile cases were recorded from the previous zod
// request validation, which the C# validation must agree with.
public sealed class RequestParityTests
{
    private const string RequestCases = "requests.json";
    private static readonly Curriculum Curriculum = TestCurriculum.Load();

    public static TheoryData<string> CaseNames => Fixtures.CaseNames(RequestCases);

    [Theory]
    [MemberData(nameof(CaseNames))]
    public async Task RequestOutcomeMatchesTheCase(string name)
    {
        var entry = Fixtures.Case(RequestCases, name);
        var request = JsonRequest(Fixtures.InputJson(entry));

        var read = (string)entry["endpoint"]! switch
        {
            "worksheets" => ReadWorksheetRequest(request),
            "usefulness" => ReadUsefulnessRequest(request),
            "profile" => ReadProfile(request),
            "levels" => ReadLevels(request),
            _ => ReadIllustrationReview(request),
        };

        if (entry["invalid"] is null)
        {
            var normalized = await read;
            Assert.True(JsonNode.DeepEquals(entry["expected"], normalized), $"Normalized request differs: {normalized.ToJsonString()}");
            return;
        }
        var error = await Assert.ThrowsAsync<ApiException>(() => read);
        Assert.Equal("invalid_request", error.Error.Code);
        Assert.Equal("A kérés nem felel meg az elvárt formátumnak.", error.Error.Message);
        var expectedPaths = entry["issues"]!.AsArray().Select(issue => (string)issue!["path"]!).ToList();
        Assert.Contains(expectedPaths[0], error.Error.Details!.Select(issue => issue.Path));
        if (expectedPaths.Distinct().Count() == 1) Assert.All(error.Error.Details!, issue => Assert.Equal(expectedPaths[0], issue.Path));
    }

    private static async Task<JsonNode> ReadWorksheetRequest(HttpRequest request)
    {
        var read = await RequestBodies.ReadWorksheetRequestAsync(request, Curriculum, TestContext.Current.CancellationToken);
        return new JsonObject { ["request"] = read.Request, ["skillId"] = read.Skill.Id };
    }

    private static async Task<JsonNode> ReadUsefulnessRequest(HttpRequest request)
    {
        var read = await RequestBodies.ReadUsefulnessRequestAsync(request, Curriculum, TestContext.Current.CancellationToken);
        return new JsonObject { ["skillId"] = read.Skill.Id, ["refresh"] = read.Refresh };
    }

    private static async Task<JsonNode> ReadProfile(HttpRequest request) =>
        JsonSerializer.SerializeToNode(await RequestBodies.ReadProfileAsync(request, TestContext.Current.CancellationToken), JsonSerializerOptions.Web)!;

    private static async Task<JsonNode> ReadLevels(HttpRequest request) =>
        new JsonObject { ["levels"] = JsonSerializer.SerializeToNode(await RequestBodies.ReadLevelsRequestAsync(request, Curriculum, TestContext.Current.CancellationToken)) };

    private static async Task<JsonNode> ReadIllustrationReview(HttpRequest request) =>
        JsonSerializer.SerializeToNode(await RequestBodies.ReadIllustrationReviewRequestAsync(request, TestContext.Current.CancellationToken), JsonSerializerOptions.Web)!;

    private static HttpRequest JsonRequest(string body)
    {
        var context = new DefaultHttpContext();
        context.Request.ContentType = "application/json";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        return context.Request;
    }
}
