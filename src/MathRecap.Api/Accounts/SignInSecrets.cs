using System.Buffers.Text;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace MathRecap.Api.Accounts;

// The emailed sign-in code and link token, and the hashes that are stored instead of them.
public static partial class SignInSecrets
{
    // SHA-256 and HMAC-SHA256 hashes are 32 bytes.
    public const int HashLength = 32;

    public static string NewCode() => RandomNumberGenerator.GetInt32(1_000_000).ToString("D6", CultureInfo.InvariantCulture);

    public static string NewLinkToken() => Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));

    public static bool IsCode(string? value) => value is not null && CodeFormat().IsMatch(value);

    // Keyed with a server secret, because a plain hash of six digits is reversed by trying them all.
    // The challenge ID makes equal codes of different challenges hash differently.
    public static byte[] HashCode(byte[] key, Guid challengeId, string code) =>
        HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{challengeId:N}:{code}"));

    public static byte[] HashLinkToken(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token));

    [GeneratedRegex(@"^[0-9]{6}\z")]
    private static partial Regex CodeFormat();
}
