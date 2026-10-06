using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using System.Text.Unicode;

namespace MathRecap.Api.Dev;

// The /dev/outbox.html page: the outbox's messages, with clickable links.
public static partial class DevOutboxPage
{
    // Accented letters stay readable in the page source.
    private static readonly HtmlEncoder Encoder = HtmlEncoder.Create(UnicodeRanges.All);

    public static string Render(IReadOnlyList<OutboxMessage> messages)
    {
        var html = new StringBuilder($$"""
            <!DOCTYPE html>
            <html lang="hu">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>MathRecap - fejlesztői postafiók</title>
            <link rel="stylesheet" href="/theme.css">
            <link rel="stylesheet" href="/text-page.css">
            </head>
            <body>
            <header class="topbar"><a class="brand" href="/sign-in.html"><span class="logo" aria-hidden="true">√</span>MathRecap <small>fejlesztői postafiók</small></a></header>
            <main class="text-page">
            <p class="eyebrow">Csak helyi teszteléshez</p>
            <h1>Fejlesztői postafiók</h1>
            <p class="lead">Az alkalmazás ide teszi az e-maileket ahelyett, hogy elküldené őket. Az utolsó {{DevOutbox.Capacity}} üzenet látszik, a legújabb elöl.</p>
            <p><a class="btn ghost" href="/dev/outbox.html">Frissítés</a></p>

            """);
        if (messages.Count == 0) html.Append("<p>Még nincs üzenet.</p>\n");
        foreach (var message in messages)
        {
            html.Append(CultureInfo.InvariantCulture, $"""
                <article class="message">
                <h2>{Encode(message.Subject)}</h2>
                <p class="meta">Címzett: {Encode(message.To)} · {message.SentAt.ToLocalTime():yyyy-MM-dd HH:mm:ss}</p>
                <pre>{WithLinks(message.Body)}</pre>
                </article>

                """);
        }
        return html.Append("</main>\n</body>\n</html>\n").ToString();
    }

    private static string Encode(string text) => Encoder.Encode(text);

    private static string WithLinks(string text) =>
        string.Concat(Url().Split(text).Select((part, index) => index % 2 == 1 ? $"<a href=\"{Encode(part)}\">{Encode(part)}</a>" : Encode(part)));

    // Captured, so Split keeps the URLs as the odd parts.
    [GeneratedRegex(@"(https?://\S+)")]
    private static partial Regex Url();
}
