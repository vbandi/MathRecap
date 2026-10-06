using System.Text.Json.Nodes;

namespace MathRecap.Api.Tests.TestHost;

// The JSON files in tests/fixtures, copied next to the test assembly.
public static class Fixtures
{
    public static JsonObject Load(string path) =>
        JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures", path)))!.AsObject();

    public static IReadOnlyList<JsonObject> Cases(string path) => [.. Load(path)["cases"]!.AsArray().Select(entry => entry!.AsObject())];

    public static JsonObject Case(string path, string name) => Cases(path).Single(entry => (string)entry["name"]! == name);

    public static TheoryData<string> CaseNames(string path) => [.. Cases(path).Select(entry => (string)entry["name"]!)];

    // A case's input as JSON text: "inputJson" verbatim, or "input" serialized.
    public static string InputJson(JsonObject entry) => entry["inputJson"]?.GetValue<string>() ?? entry["input"]?.ToJsonString() ?? "null";
}
