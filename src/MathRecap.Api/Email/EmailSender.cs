namespace MathRecap.Api.Email;

public sealed record EmailMessage(string To, string Subject, string Body);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

public static class EmailSending
{
    // Without an email sender nobody can sign in. Development may run without one (sign-in requests then
    // fail with email_unavailable); other environments must not start.
    public static void RequireEmailSenderOutsideDevelopment(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsDevelopment() && !builder.Services.Any(service => service.ServiceType == typeof(IEmailSender)))
        {
            throw new InvalidOperationException("No email sender is configured, so nobody could sign in. The only sender so far is the dev outbox, which is allowed in Development only.");
        }
    }
}
