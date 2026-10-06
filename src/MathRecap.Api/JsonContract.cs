using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using LateApexEarlySpeed.Json.Schema;
using LateApexEarlySpeed.Json.Schema.Common;
using LateApexEarlySpeed.Json.Schema.JInstance;
using LateApexEarlySpeed.Json.Schema.Keywords;

namespace MathRecap.Api;

// A JSON format defined by a JSON Schema file (an embedded *.schema.json), read the way the zod
// validation it replaced read it: numbers are doubles, every free-text string is trimmed with
// JavaScript's whitespace before it is checked, and string lengths count UTF-16 code units. Strings
// the schema compares with const or enum (union discriminators, sizes) are taken verbatim.
public sealed class JsonContract
{
    private static readonly JsonSchemaOptions ListAllErrors = new() { OutputFormat = OutputFormat.List };

    private readonly JsonNode schema;
    private readonly JsonValidator validator;
    private readonly HashSet<string> verbatimProperties;

    private JsonContract(string schemaText)
    {
        schema = JsonNode.Parse(schemaText)!;
        SchemaText = schema.ToJsonString(JavaScriptText.JsonOptions);
        var options = new JsonValidatorOptions { DefaultDialect = DialectKind.Draft202012 };
        options.KeywordRegistry.AddKeyword<Utf16MaxLengthKeyword>();
        validator = new JsonValidator(schemaText, options);
        verbatimProperties = [.. Descendants(schema).OfType<JsonObject>()
            .Select(node => node["properties"]).OfType<JsonObject>().SelectMany(properties => properties)
            .Where(property => property.Value is JsonObject definition && (definition.ContainsKey("const") || definition.ContainsKey("enum")))
            .Select(property => property.Key)];
    }

    // The schema as compact JSON.
    public string SchemaText { get; }

    public static JsonContract Load(string fileName)
    {
        using var stream = typeof(JsonContract).Assembly.GetManifestResourceStream(fileName) ?? throw new InvalidOperationException($"Missing embedded schema: {fileName}");
        using var reader = new StreamReader(stream);
        return new JsonContract(reader.ReadToEnd());
    }

    // Parses JSON text into the normalized form that is validated and passed on. Throws JsonException
    // for invalid JSON.
    public JsonNode? Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return Normalize(document.RootElement, propertyName: null);
    }

    public IReadOnlyList<ValidationIssue> Validate(JsonNode? value)
    {
        var result = validator.Validate(JsonSerializer.SerializeToElement(value), ListAllErrors);
        return result.IsValid ? [] : new SchemaIssues(schema, value).Describe([.. result.ValidationErrors]);
    }

    private JsonNode? Normalize(JsonElement element, string? propertyName) => element.ValueKind switch
    {
        JsonValueKind.Object => NormalizeObject(element),
        JsonValueKind.Array => new JsonArray([.. element.EnumerateArray().Select(item => Normalize(item, propertyName: null))]),
        JsonValueKind.String when propertyName is not null && verbatimProperties.Contains(propertyName) => JsonValue.Create(element.GetString()),
        JsonValueKind.String => JsonValue.Create(JavaScriptText.Trim(element.GetString()!)),
        // A number too large for a double is Infinity in JavaScript, which zod rejects; the raw number
        // fails the schema's bounds the same way.
        JsonValueKind.Number => element.TryGetDouble(out var number) && double.IsFinite(number) ? JsonValue.Create(number) : JsonValue.Create(element.Clone()),
        JsonValueKind.True or JsonValueKind.False => JsonValue.Create(element.GetBoolean()),
        _ => null,
    };

    private JsonObject NormalizeObject(JsonElement element)
    {
        var result = new JsonObject();
        // A repeated key keeps its last value, as in JSON.parse.
        foreach (var property in element.EnumerateObject()) result[property.Name] = Normalize(property.Value, property.Name);
        return result;
    }

    private static IEnumerable<JsonNode> Descendants(JsonNode node) => node switch
    {
        JsonObject value => [value, .. value.Select(property => property.Value).OfType<JsonNode>().SelectMany(Descendants)],
        JsonArray items => [items, .. items.OfType<JsonNode>().SelectMany(Descendants)],
        _ => [node],
    };

    // zod counted string lengths in UTF-16 code units; JSON Schema counts code points.
    [Keyword("maxLength")]
    [JsonConverter(typeof(Utf16MaxLengthConverter))]
    private sealed class Utf16MaxLengthKeyword(int maximum) : ValidationKeywordBase
    {
        public int Maximum => maximum;

        protected override ValidationResult ValidateCore(JsonInstanceElement instance, JsonSchemaOptions options) =>
            instance.ValueKind != JsonValueKind.String || instance.GetString()!.Length <= maximum
                ? ValidationResult.ValidResult
                : ValidationResult.SingleErrorFailedResult(new ValidationError(ResultCode.StringLengthOutOfRange, $"Too big: expected string to have <={maximum} characters", options.ValidationPathStack, Name, instance.Location));
    }

    private sealed class Utf16MaxLengthConverter : JsonConverter<Utf16MaxLengthKeyword>
    {
        public override Utf16MaxLengthKeyword Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => new(reader.GetInt32());

        public override void Write(Utf8JsonWriter writer, Utf16MaxLengthKeyword value, JsonSerializerOptions options) => writer.WriteNumberValue(value.Maximum);
    }
}
