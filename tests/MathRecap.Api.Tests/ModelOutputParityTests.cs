using System.Text.Json.Nodes;
using MathRecap.Api.Ai;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

// tests/fixtures/model-output records what the previous zod validation did with each payload: the
// normalized output, or a rejection with zod's issues. The C# validation must agree on every case, and
// report an issue where zod reported the first one.
public sealed class ModelOutputParityTests
{
    private const string WorksheetCases = "model-output/worksheet.json";
    private const string UsefulnessCases = "model-output/usefulness.json";
    private static readonly Curriculum Curriculum = TestCurriculum.Load();

    public static TheoryData<string> WorksheetCaseNames => Fixtures.CaseNames(WorksheetCases);

    public static TheoryData<string> UsefulnessCaseNames => Fixtures.CaseNames(UsefulnessCases);

    [Theory]
    [MemberData(nameof(WorksheetCaseNames))]
    public void WorksheetOutcomeMatchesZod(string name)
    {
        var entry = Fixtures.Case(WorksheetCases, name);
        var skill = Curriculum.Find((string)entry["skillId"]!)!;
        var worksheet = ModelOutput.Worksheet.Parse(Fixtures.InputJson(entry));

        var issues = ModelOutput.ValidateWorksheet(worksheet, Curriculum.NeighborhoodOf(skill));

        AssertOutcome(entry, worksheet, issues);
    }

    [Theory]
    [MemberData(nameof(UsefulnessCaseNames))]
    public void UsefulnessOutcomeMatchesZod(string name)
    {
        var entry = Fixtures.Case(UsefulnessCases, name);
        var usefulness = ModelOutput.Usefulness.Parse(Fixtures.InputJson(entry));

        var issues = ModelOutput.Usefulness.Validate(usefulness);

        AssertOutcome(entry, usefulness, issues);
    }

    private static void AssertOutcome(JsonObject entry, JsonNode? output, IReadOnlyList<ValidationIssue> issues)
    {
        if (entry["invalid"] is null)
        {
            Assert.Empty(issues);
            Assert.True(JsonNode.DeepEquals(entry["expected"], output), $"Normalized output differs: {output?.ToJsonString()}");
            return;
        }
        var zodIssuePaths = entry["issues"]!.AsArray().Select(issue => (string)issue!["path"]!).ToList();
        Assert.Contains(zodIssuePaths[0], issues.Select(issue => issue.Path));
        // A single defect is reported where zod reported it, without noise from elsewhere.
        if (zodIssuePaths.Distinct().Count() == 1) Assert.All(issues, issue => Assert.Equal(zodIssuePaths[0], issue.Path));
    }
}
