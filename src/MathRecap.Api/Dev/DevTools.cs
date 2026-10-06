using MathRecap.Api.Accounts;
using MathRecap.Api.Email;
using Microsoft.Extensions.Options;

namespace MathRecap.Api.Dev;

public sealed class DevOutboxOptions
{
    public const string SectionName = "DevOutbox";

    public bool Enabled { get; set; }
}

public sealed class DevAccountsOptions
{
    public const string SectionName = "DevAccounts";

    public bool Enabled { get; set; }

    public List<DevAccount> Accounts { get; set; } = [];
}

public sealed class DevAccount
{
    public string Email { get; set; } = "";

    public string Label { get; set; } = "";
}

public sealed record DevAccountsResponse(IReadOnlyList<DevAccount> Accounts);

public sealed record OutboxResponse(IReadOnlyList<OutboxMessage> Messages);

// Aids for local testing without email: the dev outbox, which keeps the sign-in emails for
// /dev/outbox.html instead of sending them, and dev accounts, which sign in with one click. Both let
// anyone sign in, so the app refuses to start with either enabled outside Development.
public static class DevTools
{
    public const string OutboxPage = "/dev/outbox.html";

    public static void AddDevTools(this WebApplicationBuilder builder)
    {
        var outboxEnabled = builder.Configuration.GetValue<bool>($"{DevOutboxOptions.SectionName}:Enabled");
        var accountsEnabled = builder.Configuration.GetValue<bool>($"{DevAccountsOptions.SectionName}:Enabled");
        if (!builder.Environment.IsDevelopment())
        {
            if (outboxEnabled) throw new InvalidOperationException("DevOutbox:Enabled is only allowed in the Development environment: the outbox shows every sign-in code to anyone.");
            if (accountsEnabled) throw new InvalidOperationException("DevAccounts:Enabled is only allowed in the Development environment: dev accounts sign in without an email code.");
        }

        if (outboxEnabled)
        {
            builder.Services.AddSingleton<DevOutbox>();
            builder.Services.AddSingleton<IEmailSender>(services => services.GetRequiredService<DevOutbox>());
        }
        builder.Services.AddOptions<DevAccountsOptions>()
            .BindConfiguration(DevAccountsOptions.SectionName)
            .Validate(options => options.Accounts.All(account => EmailAddress.TryParse(account.Email) is not null && account.Label.Length > 0), "Every DevAccounts:Accounts entry needs a valid Email and a Label.")
            .ValidateOnStart();
    }

    // Maps the endpoints of the enabled tools; the others do not exist (404). None needs a session.
    public static void MapDevTools(this WebApplication app, RouteGroupBuilder api)
    {
        if (app.Services.GetService<DevOutbox>() is { } outbox)
        {
            api.MapGet("/dev/outbox", () => new OutboxResponse(outbox.Messages)).AllowAnonymous();
            app.MapGet(OutboxPage, (HttpContext context) =>
            {
                context.Response.Headers.CacheControl = "no-store";
                return TypedResults.Content(DevOutboxPage.Render(outbox.Messages), "text/html; charset=utf-8");
            }).AllowAnonymous();
        }

        var options = app.Services.GetRequiredService<IOptions<DevAccountsOptions>>().Value;
        if (!options.Enabled) return;
        api.MapGet("/dev/accounts", () => new DevAccountsResponse(options.Accounts)).AllowAnonymous();
        api.MapPost("/dev/sign-in", async (HttpContext context, UserAccounts users, CancellationToken cancellationToken) =>
        {
            var body = await JsonRequests.ReadAsync<SignInRequest>(context.Request, cancellationToken);
            var requested = EmailAddress.TryParse(body.Email)?.Normalized;
            var email = options.Accounts.Select(account => EmailAddress.Parse(account.Email)).FirstOrDefault(email => email.Normalized == requested)
                ?? throw new ApiException(StatusCodes.Status403Forbidden, "not_dev_account", "Ez a cím nem fejlesztői fiók.");
            return new AccountResponse((await users.SignInAsync(context, email, cancellationToken)).Email);
        }).AllowAnonymous();
    }
}
