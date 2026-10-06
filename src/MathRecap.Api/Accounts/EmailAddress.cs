using System.Text.RegularExpressions;

namespace MathRecap.Api.Accounts;

// An email address as entered (trimmed), and its normalized form that identifies the account.
public sealed partial record EmailAddress(string Value, string Normalized)
{
    public const int MaxLength = 254;

    // Null when the input is not a plausible email address.
    public static EmailAddress? TryParse(string? input)
    {
        var value = input?.Trim();
        return value is { Length: > 0 and <= MaxLength } && Format().IsMatch(value) ? new EmailAddress(value, value.ToLowerInvariant()) : null;
    }

    public static EmailAddress Parse(string? input) =>
        TryParse(input) ?? throw new ApiException(StatusCodes.Status400BadRequest, "invalid_email", "Adj meg egy érvényes e-mail-címet.");

    // A pragmatic subset of RFC 5322: the usual characters before the @, dot-separated labels after it.
    [GeneratedRegex(@"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+\z")]
    private static partial Regex Format();
}
