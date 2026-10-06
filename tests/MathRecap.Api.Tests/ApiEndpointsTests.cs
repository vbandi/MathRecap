using System.Net;
using System.Net.Http.Json;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

public sealed class ApiEndpointsTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Theory]
    [InlineData("GET", "/api/x")]
    [InlineData("POST", "/api/x")]
    [InlineData("GET", "/api/nested/file.json")]
    public async Task UnknownApiRoutesReturnJsonNotFound(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        var client = await factory.CreateSignedInClientAsync();
        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(TestContext.Current.CancellationToken);
        Assert.Equal(new ApiError("not_found", "Az API-végpont nem található."), body?.Error);
    }
}
