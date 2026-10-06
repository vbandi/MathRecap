using MathRecap.Api.Email;

namespace MathRecap.Api.Dev;

public sealed record OutboxMessage(string To, string Subject, string Body, DateTimeOffset SentAt);

// Keeps the last emails in memory instead of sending them, for local testing.
public sealed class DevOutbox(TimeProvider time) : IEmailSender
{
    public const int Capacity = 50;

    private readonly LinkedList<OutboxMessage> messages = new();
    private readonly Lock gate = new();

    // Newest first.
    public IReadOnlyList<OutboxMessage> Messages
    {
        get
        {
            lock (gate) return [.. messages];
        }
    }

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            messages.AddFirst(new OutboxMessage(message.To, message.Subject, message.Body, time.GetUtcNow()));
            if (messages.Count > Capacity) messages.RemoveLast();
        }
        return Task.CompletedTask;
    }
}
