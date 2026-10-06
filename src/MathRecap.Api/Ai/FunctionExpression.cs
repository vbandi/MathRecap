using System.Text.RegularExpressions;

namespace MathRecap.Api.Ai;

// isValidExpression of web/figure-model.mjs: whether the browser can plot a function figure's
// expression, e.g. "2x^2 - 3", "sin(x)/x" or "sqrt(x+1)". The server only needs the verdict, so this
// recognizes the same grammar without evaluating it.
public static partial class FunctionExpression
{
    public const int MaxLength = 200;

    // Longest first, so "exp" is not split into "e" + "x" + "p".
    private static readonly string[] Names = ["sqrt", "sin", "cos", "tan", "abs", "log", "exp", "ln", "lg", "pi", "e", "x"];
    private static readonly string[] Values = ["x", "pi", "e"];

    public static bool IsValid(string source)
    {
        if (JavaScriptText.Trim(source).Length == 0 || source.Length > MaxLength) return false;
        var tokens = Tokenize(source);
        return tokens is not null && new Parser(tokens).ParsesCompletely();
    }

    private static List<Token>? Tokenize(string source)
    {
        // Minus signs (−, –), multiplication signs (·, ×, ⋅), π and ** in their plain forms.
        var text = source.Replace('\u2212', '-').Replace('\u2013', '-').Replace('\u00B7', '*').Replace('\u00D7', '*').Replace('\u22C5', '*').Replace("\u03C0", "pi").Replace("**", "^");
        var tokens = new List<Token>();
        var index = 0;
        while (index < text.Length)
        {
            if (JavaScriptText.IsWhiteSpace(text[index]))
            {
                index++;
            }
            else if (NumberPattern().Match(text, index) is { Success: true } number)
            {
                tokens.Add(new Token("number"));
                index += number.Length;
            }
            else if (char.IsAsciiLetter(text[index]))
            {
                var end = index;
                while (end < text.Length && char.IsAsciiLetter(text[end])) end++;
                if (!AddNames(text[index..end].ToLowerInvariant(), tokens)) return null;
                index = end;
            }
            else if ("+-*/^()".Contains(text[index]))
            {
                tokens.Add(new Token(text[index].ToString()));
                index++;
            }
            else
            {
                return null;
            }
        }
        return tokens;
    }

    private static bool AddNames(string run, List<Token> tokens)
    {
        while (run.Length > 0)
        {
            var name = Names.FirstOrDefault(candidate => run.StartsWith(candidate, StringComparison.Ordinal));
            if (name is null) return false;
            tokens.Add(new Token("name", name));
            run = run[name.Length..];
        }
        return true;
    }

    [GeneratedRegex(@"\G(?:[0-9]+(?:[.,][0-9]+)?|[.,][0-9]+)")]
    private static partial Regex NumberPattern();

    private readonly record struct Token(string Kind, string? Name = null);

    // sum = product (("+" | "-") product)*; product = signed (("*" | "/") signed | power)*;
    // signed = "-" signed | "+"? power; power = primary ("^" signed)?;
    // primary = number | "(" sum ")" | x | pi | e | function "(" sum ")"
    private sealed class Parser(List<Token> tokens)
    {
        private int position;

        private string? Next => position < tokens.Count ? tokens[position].Kind : null;

        public bool ParsesCompletely() => Sum() && position == tokens.Count;

        private bool Sum()
        {
            if (!Product()) return false;
            while (Next is "+" or "-")
            {
                position++;
                if (!Product()) return false;
            }
            return true;
        }

        private bool Product()
        {
            if (!Signed()) return false;
            while (true)
            {
                if (Next is "*" or "/")
                {
                    position++;
                    if (!Signed()) return false;
                }
                else if (Next is "number" or "name" or "(")
                {
                    if (!Power()) return false;
                }
                else
                {
                    return true;
                }
            }
        }

        private bool Signed()
        {
            if (Next == "-")
            {
                position++;
                return Signed();
            }
            if (Next == "+") position++;
            return Power();
        }

        private bool Power()
        {
            if (!Primary()) return false;
            if (Next != "^") return true;
            position++;
            return Signed();
        }

        private bool Primary()
        {
            if (position == tokens.Count) return false;
            var token = tokens[position++];
            return token.Kind switch
            {
                "number" => true,
                "(" => Sum() && Take(")"),
                "name" => Values.Contains(token.Name) || (Take("(") && Sum() && Take(")")),
                _ => false,
            };
        }

        private bool Take(string kind)
        {
            if (Next != kind) return false;
            position++;
            return true;
        }
    }
}
