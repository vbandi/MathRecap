using System.Net;
using System.Text.Json.Nodes;

namespace MathRecap.Api.Tests.TestHost;

public sealed record RecordedRequest(Uri Uri, string? Authorization, JsonNode Body);

// Stands in for OpenRouter: answers requests from a queue of responses and records them. A request
// with no queued response fails with an exception.
public sealed class FakeOpenRouter
{
    private readonly Queue<Func<CancellationToken, Task<HttpResponseMessage>>> responses = new();
    private readonly List<RecordedRequest> requests = [];
    private readonly Lock gate = new();

    public IReadOnlyList<RecordedRequest> Requests
    {
        get
        {
            lock (gate) return [.. requests];
        }
    }

    public HttpMessageHandler CreateHandler() => new Handler(this);

    public void RespondWithContent(string content) =>
        RespondWithBody(new JsonObject { ["choices"] = new JsonArray(new JsonObject { ["message"] = new JsonObject { ["content"] = content } }) }.ToJsonString());

    public void RespondWithJson(JsonNode? answer) => RespondWithContent(answer?.ToJsonString() ?? "null");

    public void RespondWithBody(string body) => Enqueue(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) }));

    public void RespondWithStatus(HttpStatusCode status, string body = "") => Enqueue(_ => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) }));

    // Never answers; the request ends when it is canceled (by the client's timeout).
    public void RespondNever() => Enqueue(async cancellationToken =>
    {
        await Task.Delay(Timeout.Infinite, cancellationToken);
        throw new InvalidOperationException("Unreachable.");
    });

    private void Enqueue(Func<CancellationToken, Task<HttpResponseMessage>> response)
    {
        lock (gate) responses.Enqueue(response);
    }

    private async Task<HttpResponseMessage> AnswerAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var body = JsonNode.Parse(await request.Content!.ReadAsStringAsync(cancellationToken))!;
        Func<CancellationToken, Task<HttpResponseMessage>>? response;
        lock (gate)
        {
            requests.Add(new RecordedRequest(request.RequestUri!, request.Headers.Authorization?.ToString(), body));
            responses.TryDequeue(out response);
        }
        return response is null
            ? throw new InvalidOperationException($"Unexpected OpenRouter request to {request.RequestUri}.")
            : await response(cancellationToken);
    }

    private sealed class Handler(FakeOpenRouter openRouter) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            openRouter.AnswerAsync(request, cancellationToken);
    }
}
