using System.Text.Encodings.Web;
using System.Text.Json;

namespace MathRecap.Api;

// Text rules of JavaScript, which the request and model output formats were first defined in.
public static class JavaScriptText
{
    // Serializes JSON for prompts like JSON.stringify: camelCase names, non-ASCII text left unescaped.
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    // The whitespace of String.prototype.trim and \s: like char.IsWhiteSpace, but with U+FEFF and
    // without U+0085.
    public static bool IsWhiteSpace(char value) => value == '﻿' || (value != '\u0085' && char.IsWhiteSpace(value));

    public static string Trim(string value)
    {
        var start = 0;
        var end = value.Length;
        while (start < end && IsWhiteSpace(value[start])) start++;
        while (end > start && IsWhiteSpace(value[end - 1])) end--;
        return value[start..end];
    }
}
