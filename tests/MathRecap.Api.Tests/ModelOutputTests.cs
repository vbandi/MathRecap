using System.Text.Json.Nodes;
using MathRecap.Api.Ai;

namespace MathRecap.Api.Tests;

public sealed class ModelOutputTests
{
    private static readonly HashSet<string> DiagnosticSkillIds = ["ALG-08"];

    public static TheoryData<string> InvalidWorksheets => ["duplicate problem", "missing answer", "orphan answer", "unknown diagnostic skill", "missing next step"];

    [Fact]
    public void AValidWorksheetPasses() => Assert.Empty(ModelOutput.ValidateWorksheet(Worksheet(), DiagnosticSkillIds));

    [Theory]
    [MemberData(nameof(InvalidWorksheets))]
    public void WorksheetsNeedOneMatchingAnswerPerProblemAndKnownDiagnosticSkills(string defect)
    {
        var worksheet = Worksheet();
        switch (defect)
        {
            case "duplicate problem":
                worksheet["exerciseGroups"]![0]!["problems"]!.AsArray().Add(worksheet["exerciseGroups"]![0]!["problems"]![0]!.DeepClone());
                break;
            case "missing answer":
                worksheet["answers"] = new JsonArray();
                break;
            case "orphan answer":
                worksheet["answers"]![0]!["problemId"] = "p2";
                break;
            case "unknown diagnostic skill":
                worksheet["diagnosticNotes"]![0]!["skillId"] = "GEO-99";
                break;
            case "missing next step":
                worksheet["suggestedNextSteps"] = new JsonArray();
                break;
        }

        Assert.NotEmpty(ModelOutput.ValidateWorksheet(worksheet, DiagnosticSkillIds));
    }

    [Fact]
    public void FigurePartsAreAcceptedInWorksheetContent()
    {
        var worksheet = WorksheetWithPrompt("""
            [
              { "type": "text", "value": "Mekkora α?" },
              { "type": "figure", "caption": "Az ABC háromszög", "figure": { "kind": "plane", "size": "small", "xRange": [-1, 7], "yRange": [-1, 5], "elements": [
                { "shape": "polygon", "points": [[0, 0], [6, 0], [2, 4]], "filled": true },
                { "shape": "point", "at": [0, 0], "label": "A" },
                { "shape": "angle", "vertex": [0, 0], "from": [6, 0], "to": [2, 4], "label": "α" },
                { "shape": "segment", "from": [0, 0], "to": [6, 0], "label": "6 cm", "ticks": 1 }] } },
              { "type": "figure", "figure": { "kind": "plane", "xRange": [-5, 5], "yRange": [-3, 6], "axes": true, "grid": true, "elements": [{ "shape": "function", "expression": "x^2 - 2", "label": "f" }] } },
              { "type": "figure", "figure": { "kind": "barChart", "categories": ["H", "K"], "series": [{ "values": [3, 5] }] } },
              { "type": "figure", "figure": { "kind": "pieChart", "slices": [{ "label": "A", "value": 1 }, { "label": "B", "value": 3 }] } },
              { "type": "figure", "figure": { "kind": "numberLine", "range": [-3, 5], "intervals": [{ "from": -1, "to": null, "fromClosed": true }] } }
            ]
            """);

        Assert.Empty(ModelOutput.ValidateWorksheet(worksheet, DiagnosticSkillIds));
        var prompt = worksheet["exerciseGroups"]![0]!["problems"]![0]!["prompt"]!.AsArray();
        Assert.Equal(6, prompt.Count);
        Assert.Empty(prompt[5]!["figure"]!["points"]!.AsArray());
    }

    [Theory]
    [InlineData("""{ "kind": "plane", "xRange": [5, 1], "yRange": [0, 1], "elements": [{ "shape": "point", "at": [0, 0] }] }""")]
    [InlineData("""{ "kind": "plane", "xRange": [0, 1], "yRange": [0, 1], "elements": [{ "shape": "function", "expression": "fetch(x)" }] }""")]
    [InlineData("""{ "kind": "plane", "xRange": [0, 1], "yRange": [0, 1], "elements": [{ "shape": "path", "d": "M0 0" }] }""")]
    [InlineData("""{ "kind": "plane", "xRange": [0, 1], "yRange": [0, 1], "elements": [{ "shape": "point", "at": [0, 0], "style": "fill:red" }] }""")]
    [InlineData("""{ "kind": "barChart", "categories": ["A", "B"], "series": [{ "values": [1] }] }""")]
    [InlineData("""{ "kind": "numberLine", "range": [0, 10], "intervals": [{ "from": 5, "to": 2 }] }""")]
    [InlineData("""{ "kind": "svg", "markup": "<svg onload=alert(1)>" }""")]
    public void InvalidFigureDescriptionsAreRejected(string figure)
    {
        var worksheet = WorksheetWithPrompt($$"""[{ "type": "figure", "figure": {{figure}} }]""");

        Assert.NotEmpty(ModelOutput.ValidateWorksheet(worksheet, DiagnosticSkillIds));
    }

    // The schema file is the model's format definition and part of every worksheet prompt.
    [Fact]
    public void TheWorksheetSchemaKeepsItsShape()
    {
        var schema = JsonNode.Parse(ModelOutput.Worksheet.SchemaText)!;
        var definitions = schema["$defs"]!.AsObject();

        Assert.True(ModelOutput.Worksheet.SchemaText.Length < 16_000, $"schema grew to {ModelOutput.Worksheet.SchemaText.Length} characters");
        Assert.Equal(["content", "figure", "label", "planeElement", "point", "range"], definitions.Select(definition => definition.Key).Order());
        Assert.Equal(["plane", "barChart", "pieChart", "numberLine"], definitions["figure"]!["oneOf"]!.AsArray().Select(figure => (string)figure!["properties"]!["kind"]!["const"]!));
        Assert.Equal([2, 2], [(int)definitions["point"]!["minItems"]!, (int)definitions["point"]!["maxItems"]!]);
        Assert.Contains("Csak x, számok", ModelOutput.Worksheet.SchemaText);
        Assert.Equal(["kind", "range"], definitions["figure"]!["oneOf"]![3]!["required"]!.AsArray().Select(name => (string)name!));
    }

    private static JsonObject WorksheetWithPrompt(string prompt)
    {
        var worksheet = Worksheet();
        worksheet["exerciseGroups"]![0]!["problems"]![0]!["prompt"] = JsonNode.Parse(prompt);
        return ModelOutput.Worksheet.Parse(worksheet.ToJsonString())!.AsObject();
    }

    public static JsonObject Worksheet() => ModelOutput.Worksheet.Parse("""
        {
          "title": "Betűs kifejezések", "explanation": [{ "type": "text", "value": "Egyszerűsítünk." }], "assumedPrerequisites": ["Alapműveletek"],
          "workedExamples": [{ "title": "Példa", "steps": [{ "type": "inlineMath", "value": "2x + x = 3x" }] }],
          "whyThisMatters": [{ "type": "text", "value": "Segít az egyenletekben." }],
          "exerciseGroups": [{ "title": "Gyakorlás", "problems": [{ "id": "p1", "prompt": [{ "type": "text", "value": "Egyszerűsítsd: 2x + x" }] }] }],
          "canChecklist": ["El tudom végezni az összevonást."],
          "answers": [{ "problemId": "p1", "answer": [{ "type": "inlineMath", "value": "3x" }], "reasoning": [{ "type": "text", "value": "Azonos tagok." }] }],
          "diagnosticNotes": [{ "skillId": "ALG-08", "note": "Azonos tagokat vonj össze." }], "suggestedNextSteps": ["Oldj meg egy egyenletet."]
        }
        """)!.AsObject();
}
