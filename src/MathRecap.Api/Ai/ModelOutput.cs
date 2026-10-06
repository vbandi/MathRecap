using System.Text.Json.Nodes;

namespace MathRecap.Api.Ai;

// The formats the model must answer in. Ai/Schemas/*.schema.json is the definition the model is
// given; the worksheet rules below are the ones JSON Schema cannot express.
public static class ModelOutput
{
    public static readonly JsonContract Worksheet = JsonContract.Load("worksheet.schema.json");
    public static readonly JsonContract Usefulness = JsonContract.Load("usefulness.schema.json");

    private const int MaxTicks = 60;

    // Validates a parsed worksheet and fills in the defaults its schema declares (numberLine points
    // and intervals). Diagnostic notes may only name the given skills.
    public static IReadOnlyList<ValidationIssue> ValidateWorksheet(JsonNode? worksheet, IReadOnlySet<string> diagnosticSkillIds)
    {
        var issues = Worksheet.Validate(worksheet);
        if (issues.Count > 0) return issues;

        var found = new List<ValidationIssue>();
        CheckFigures(worksheet, "", found);
        CheckProblemIds(worksheet!.AsObject(), found);
        foreach (var note in worksheet["diagnosticNotes"]!.AsArray())
        {
            var skillId = Text(note!["skillId"]);
            if (!diagnosticSkillIds.Contains(skillId)) found.Add(new("diagnosticNotes", $"Unknown diagnostic skill ID: {skillId}"));
        }
        return found;
    }

    // Figures and plane elements can appear in any content, so this walks the whole (schema-valid)
    // document: objects with a "kind" are figures, objects with a "shape" are plane elements.
    private static void CheckFigures(JsonNode? node, string path, List<ValidationIssue> issues)
    {
        if (node is JsonArray items)
        {
            for (var index = 0; index < items.Count; index++) CheckFigures(items[index], Join(path, index.ToString()), issues);
        }
        if (node is not JsonObject value) return;
        if (value.ContainsKey("kind")) CheckFigure(value, path, issues);
        if (value.ContainsKey("shape")) CheckPlaneElement(value, path, issues);
        foreach (var (name, child) in value) CheckFigures(child, Join(path, name), issues);
    }

    private static void CheckFigure(JsonObject figure, string path, List<ValidationIssue> issues)
    {
        switch (Text(figure["kind"]))
        {
            case "plane":
                CheckRange(figure, "xRange", path, issues);
                CheckRange(figure, "yRange", path, issues);
                break;
            case "barChart":
                var categoryCount = figure["categories"]!.AsArray().Count;
                if (figure["series"]!.AsArray().Any(series => series!["values"]!.AsArray().Count != categoryCount))
                {
                    issues.Add(new(path, "Every series needs one value per category"));
                }
                break;
            case "numberLine":
                CheckRange(figure, "range", path, issues);
                var (min, max) = Range(figure["range"]);
                if (figure["tickStep"] is JsonNode tickStep && (max - min) / Number(tickStep) > MaxTicks) issues.Add(new(path, "Too many ticks"));
                figure["points"] ??= new JsonArray();
                var intervals = (figure["intervals"] ??= new JsonArray()).AsArray();
                for (var index = 0; index < intervals.Count; index++)
                {
                    var interval = intervals[index]!;
                    if (interval["from"] is JsonNode from && interval["to"] is JsonNode to && !(Number(from) < Number(to)))
                    {
                        issues.Add(new(Join(path, $"intervals.{index}"), "Interval start must be below its end"));
                    }
                }
                break;
        }
    }

    private static void CheckPlaneElement(JsonObject element, string path, List<ValidationIssue> issues)
    {
        switch (Text(element["shape"]))
        {
            case "line":
                var through = element["through"]!.AsArray();
                if (Number(through[0]![0]) == Number(through[1]![0]) && Number(through[0]![1]) == Number(through[1]![1]))
                {
                    issues.Add(new(path, "Line points must differ"));
                }
                break;
            case "function":
                if (!FunctionExpression.IsValid(Text(element["expression"]))) issues.Add(new(Join(path, "expression"), "Unsupported expression"));
                if (element.ContainsKey("domain")) CheckRange(element, "domain", path, issues);
                break;
        }
    }

    private static void CheckRange(JsonObject owner, string name, string path, List<ValidationIssue> issues)
    {
        var (min, max) = Range(owner[name]);
        if (!(max > min)) issues.Add(new(Join(path, name), "Range minimum must be below maximum"));
    }

    // Problem IDs are unique, and every problem has exactly one answer.
    private static void CheckProblemIds(JsonObject worksheet, List<ValidationIssue> issues)
    {
        var problemIds = new List<string>();
        foreach (var problem in worksheet["exerciseGroups"]!.AsArray().SelectMany(group => group!["problems"]!.AsArray()))
        {
            var id = Text(problem!["id"]);
            if (problemIds.Contains(id)) issues.Add(new("exerciseGroups", $"Duplicate problem ID: {id}"));
            else problemIds.Add(id);
        }

        var answerIds = new HashSet<string>();
        foreach (var answer in worksheet["answers"]!.AsArray())
        {
            var id = Text(answer!["problemId"]);
            if (!answerIds.Add(id)) issues.Add(new("answers", $"Duplicate answer for problem ID: {id}"));
            if (!problemIds.Contains(id)) issues.Add(new("answers", $"Orphan answer for problem ID: {id}"));
        }
        issues.AddRange(problemIds.Where(id => !answerIds.Contains(id)).Select(id => new ValidationIssue("answers", $"Missing answer for problem ID: {id}")));
    }

    private static (double Min, double Max) Range(JsonNode? range) => (Number(range![0]), Number(range[1]));

    private static double Number(JsonNode? node) => node!.GetValue<double>();

    private static string Text(JsonNode? node) => node!.GetValue<string>();

    private static string Join(string path, string segment) => path.Length == 0 ? segment : $"{path}.{segment}";
}
