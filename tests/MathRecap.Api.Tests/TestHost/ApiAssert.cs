using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;

namespace MathRecap.Api.Tests.TestHost;

public static class ApiAssert
{
    // Asserts a JSON error response ({ error: { code, message } }) and returns its error object.
    public static async Task<JsonNode> ErrorAsync(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var error = (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!["error"]!;
        Assert.Equal(code, error["code"]!.GetValue<string>());
        return error;
    }
}
