using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using LateApexEarlySpeed.Json.Schema.Common;

namespace MathRecap.Api;

public sealed record ValidationIssue(string Path, string Message);

// Turns the validator's list output into issues like the ones zod reported, with dot-separated paths
// ("exerciseGroups.0.problems"). The list output also contains the errors of every union branch, even
// of unions that passed; zod reported only the branch a discriminated union's discriminator selects,
// or the discriminator itself when it selects none.
internal sealed partial class SchemaIssues(JsonNode schema, JsonNode? instance)
{
    public IReadOnlyList<ValidationIssue> Describe(IReadOnlyList<ValidationError> errors)
    {
        var failedUnions = errors.Where(error => error.Keyword is "oneOf" or "anyOf").Select(Location.Of).ToList();
        var ignoredBranches = errors.SelectMany(IgnoredBranches).ToList();
        bool IsReported(ValidationError error)
        {
            var location = Location.Of(error);
            return UnionsOnPath(location.Keywords).All(union => failedUnions.Any(failed => failed.Keywords == union && location.IsInside(failed)))
                && !ignoredBranches.Any(location.IsInside);
        }
        return [.. errors.Where(IsReported).SelectMany(Describe).Distinct()];
    }

    // Branches whose errors are not reported: the ones a discriminator mismatch rules out, and all of
    // them when the discriminator selects none.
    private IEnumerable<Location> IgnoredBranches(ValidationError error)
    {
        var location = Location.Of(error);
        if (UnselectedBranch().Match(location.Keywords) is { Success: true } mismatch)
        {
            yield return new Location(mismatch.Groups[1].Value, location.Instance[..location.Instance.LastIndexOf('/')]);
        }
        if (error.Keyword == "oneOf" && DiscriminatorIssue(location) is not null) yield return location with { Keywords = $"{location.Keywords}/" };
    }

    private IEnumerable<ValidationIssue> Describe(ValidationError error)
    {
        var location = Location.Of(error);
        if (error.Keyword == "oneOf") return DiscriminatorIssue(location) is { } issue ? [issue] : [];
        if (error.Keyword == "required")
        {
            var value = NodeAt(instance, location.Instance) as JsonObject;
            return NodeAt(schema, location.Keywords, resolveReferences: true)!.AsArray()
                .Select(name => name!.GetValue<string>())
                .Where(name => value?.ContainsKey(name) == false)
                .Select(name => new ValidationIssue(Join(DotPath(location.Instance), name), "Required"));
        }
        if (location.Keywords.EndsWith("/additionalProperties", StringComparison.Ordinal))
        {
            var separator = location.Instance.LastIndexOf('/');
            return [new ValidationIssue(DotPath(location.Instance[..separator]), $"Unrecognized key: \"{Unescape(location.Instance[(separator + 1)..])}\"")];
        }
        return [new ValidationIssue(DotPath(location.Instance), error.ErrorMessage)];
    }

    // For a failed discriminated union: the issue when its discriminator selects no branch, or null
    // when one branch is selected (that branch reports its own errors).
    private ValidationIssue? DiscriminatorIssue(Location union)
    {
        var branches = NodeAt(schema, union.Keywords, resolveReferences: true)!.AsArray();
        var discriminator = branches[0]!["properties"]?.AsObject().FirstOrDefault(property => property.Value is JsonObject definition && definition.ContainsKey("const")).Key;
        if (discriminator is null) return null;
        var options = branches.Select(branch => branch!["properties"]![discriminator]!["const"]!.GetValue<string>()).ToList();
        var path = DotPath(union.Instance);
        if (NodeAt(instance, union.Instance) is not JsonObject value) return new ValidationIssue(path, "Invalid input: expected object");
        return value[discriminator] is JsonValue selector && selector.TryGetValue<string>(out var selected) && options.Contains(selected)
            ? null
            : new ValidationIssue(Join(path, discriminator), $"Invalid discriminator value. Expected {string.Join(" | ", options.Select(option => $"'{option}'"))}");
    }

    // The node at a JSON Pointer; in the schema, the "$ref" segments of keyword locations are followed.
    private JsonNode? NodeAt(JsonNode? root, string pointer, bool resolveReferences = false)
    {
        var node = root;
        foreach (var segment in Segments(pointer))
        {
            node = segment == "$ref" && resolveReferences
                ? NodeAt(schema, node!["$ref"]!.GetValue<string>().TrimStart('#'))
                : node switch
                {
                    JsonObject value => value[segment],
                    JsonArray items when int.TryParse(segment, out var index) && index < items.Count => items[index],
                    _ => null,
                };
        }
        return node;
    }

    // The keyword locations of the unions a keyword location passes through: ".../anyOf" for ".../anyOf/1/type".
    private static IEnumerable<string> UnionsOnPath(string keywordLocation) =>
        UnionBranch().Matches(keywordLocation).Select(match => keywordLocation[..(match.Index + 1 + match.Groups[1].Length)]);

    private static IEnumerable<string> Segments(string pointer) => pointer.Split('/').Skip(1).Select(Unescape);

    private static string Unescape(string segment) => segment.Replace("~1", "/").Replace("~0", "~");

    private static string DotPath(string pointer) => string.Join('.', Segments(pointer));

    private static string Join(string path, string segment) => path.Length == 0 ? segment : $"{path}.{segment}";

    // A discriminator mismatch (".../oneOf/2/properties/kind/const") rules out the branch ".../oneOf/2/".
    [GeneratedRegex("^(.*/oneOf/[0-9]+/)properties/[^/]+/const$")]
    private static partial Regex UnselectedBranch();

    [GeneratedRegex("/(oneOf|anyOf)/[0-9]+/")]
    private static partial Regex UnionBranch();

    // Where an error is: its keyword location in the schema and its instance location, as JSON Pointers.
    // The same keyword location applies to every item of an array, so both are needed.
    private readonly record struct Location(string Keywords, string Instance)
    {
        public static Location Of(ValidationError error) => new(error.RelativeKeywordLocation?.ToString() ?? "", error.InstanceLocation.ToString());

        public bool IsInside(Location scope) =>
            Keywords.StartsWith(scope.Keywords, StringComparison.Ordinal)
            && (Instance == scope.Instance || Instance.StartsWith($"{scope.Instance}/", StringComparison.Ordinal));
    }
}
